use crate::clientele::{Client, client_exists};
use crate::{AppState, booking, clientele, invoicing};
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::{Json, debug_handler};
use rust_decimal::Decimal;
use rust_decimal::prelude::Zero;
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, Transaction};
use time::OffsetDateTime;

#[derive(Serialize, Deserialize)]
pub struct InvoiceID {
    invoice_id: String,
}
#[derive(Serialize, Deserialize)]
pub struct ReturnFullInvoice {
    pub(crate) invoice: Invoice,
    pub(crate) invoice_items: Vec<InvoiceItem>,
    pub(crate) client: Client,
}
#[derive(Serialize, Deserialize)]
pub(crate) struct InvoiceItem {
    invoice_id: String,
    invoice_item_id: String,
    pub(crate) description: String,
    pub(crate) quantity: i32,
    pub(crate) unit_price: Decimal,
}
#[derive(Serialize, Deserialize)]
struct NewInvoiceItem {
    description: String,
    quantity: i32,
    unit_price: Decimal,
}

#[derive(Serialize, Deserialize)]
pub struct ApiResponse {
    pub(crate) message: String,
}

#[derive(Serialize, Deserialize)]
pub struct NewInvoiceInfo {
    client_id: Option<String>,
    booking_id: Option<String>,
    invoice_items: Vec<NewInvoiceItem>,
    amount_tax: Option<Decimal>,
    notes: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    due_date: OffsetDateTime,
    address_street: Option<String>,
    address_city: Option<String>,
    address_state: Option<StateCountry>,
    address_zip: Option<String>,
    address_country: StateCountry,
}

#[derive(Serialize, Deserialize)]
pub struct EditInvoiceInfo {
    client_id: String,
    invoice_items: Vec<NewInvoiceItem>,
    amount_tax: Option<Decimal>,
    notes: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    due_date: OffsetDateTime,
    address_street: Option<String>,
    address_city: Option<String>,
    address_state: Option<StateCountry>,
    address_zip: Option<String>,
    address_country: StateCountry,
    payment_completed: bool,
    #[serde(default, with = "time::serde::iso8601::option")]
    paid_at: Option<OffsetDateTime>,
}

//Invoice from POSTGRES database
#[derive(Serialize, Deserialize)]
pub struct Invoice {
    client_id: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    pub(crate) created_at: OffsetDateTime,
    pub(crate) amount_subtotal: Option<Decimal>,
    pub(crate) payment_method: Option<String>,
    pub(crate) notes: Option<String>,
    pub(crate) amount_tax: Option<Decimal>,
    pub(crate) amount_total: Option<Decimal>,
    pub(crate) booking_id: Option<String>,
    pub(crate) invoice_id: String,
    #[serde(with = "time::serde::iso8601::option")]
    pub(crate) due_date: Option<OffsetDateTime>,
    pub(crate) payment_completed: bool,
    #[serde(default, with = "time::serde::iso8601::option")]
    pub(crate) paid_at: Option<OffsetDateTime>,
    pub(crate) invoice_number: i64,
}

#[derive(Serialize, Deserialize)]
pub struct StateCountry {
    pub(crate) value: String,
    pub(crate) label: String,
}
pub async fn create_invoice(
    State(state): State<AppState>,
    Json(payload): Json<NewInvoiceInfo>,
) -> Result<(StatusCode, Json<ApiResponse>), (StatusCode, Json<ApiResponse>)> {
    let mut tx = state.db_pool.begin().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                message: format!("Error creating postgres transaction pool: {}", e).to_string(),
            }),
        )
    })?;

    let client = &state.db_pool;
    println!("creating invoice");
    // find or create client
    let client_id: String = match (payload.client_id, &payload.booking_id) {
        (Some(id), _) => {
            let client_exists = client_exists(&id, &client).await.unwrap();
            if (!client_exists) {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse {
                        message: "ERROR: Client_ID could not be found".to_string(),
                    }),
                ));
            }
            id
        }
        (None, Some(booking_id)) => {
            let booking_exists = booking::booking_exists(&booking_id, &client).await.unwrap();
            if (!booking_exists) {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse {
                        message: "ERROR: Booking_ID could not be found".to_string(),
                    }),
                ));
            }
            clientele::create_client_from_booking(&booking_id, &client)
                .await
                .unwrap()
        }
        (None, None) => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ApiResponse {
                    message: "must provide either client_id or booking_id!".to_string(),
                }),
            ));
        }
    };
    //if a new billing address is provided, update the client's address
    if payload.address_street.is_some()
        || payload.address_city.is_some()
        || payload.address_state.is_some()
        || payload.address_zip.is_some()
        || payload.address_country.value != ""
    {
        clientele::update_client_address(
            &client_id,
            &payload.address_street.unwrap(),
            &payload.address_city.unwrap(),
            payload.address_state,
            &payload.address_zip.unwrap(),
            &payload.address_country.value,
            &client,
        )
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    message: format!("Error updating client address: {}", e).to_string(),
                }),
            )
        })?;
    }

    let new_invoice_id = booking::generate_id(&client).await;

    //CALCULATE TOTALS

    let mut subtotal = Decimal::zero();
    //calculate subtotal
    for item in &payload.invoice_items {
        subtotal += item.unit_price * Decimal::from(item.quantity);
    }

    let _new_invoice = sqlx::query_scalar!(
        "INSERT INTO main.invoices (invoice_id, client_id, created_at, amount_subtotal, amount_tax, notes, booking_id,due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        new_invoice_id,
        client_id,
        OffsetDateTime::now_utc(),
        subtotal,
        payload.amount_tax.unwrap_or(Decimal::zero()),
        payload.notes,
        payload.booking_id,
        payload.due_date,
    )
        .fetch_one(&mut *tx)
        .await.map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ApiResponse {
            message: format!("Error creating Invoice: {}", e).to_string(),
        }),
    ));

    //add invoice items
    for item in payload.invoice_items {
        create_invoice_item(&mut tx, &new_invoice_id, item, client)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse {
                        message: format!("Error creating Invoice items into database: {}", e)
                            .to_string(),
                    }),
                )
            })?;
    }

    tx.commit().await.map_err(|_e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                message: "Error creating Invoice items into database".to_string(),
            }),
        )
    })?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse {
            message: "New Invoice Successfully Created".to_string(),
        }),
    ))
}
async fn create_invoice_item(
    tx: &mut Transaction<'_, Postgres>,
    invoice_id: &String,
    item: NewInvoiceItem,
    client: &sqlx::PgPool,
) -> Result<(), sqlx::Error> {
    let new_invoice_item_id = booking::generate_id(&client).await;
    println!("new invoice item id: {}", new_invoice_item_id);
    let _new_invoice_item = sqlx::query!(
        "INSERT INTO main.invoice_items (invoice_id, invoice_item_id, description, quantity, unit_price ) VALUES ($1::character varying, $2::character varying, $3::text, $4::integer, $5::numeric)",
        invoice_id,
        new_invoice_item_id,
        item.description,
        item.quantity,
        item.unit_price
    )
        .execute(&mut **tx)
        .await?;

    Ok(())
}

//get an invoice by invoice_id
#[debug_handler]
pub async fn view_invoice(
    State(state): State<AppState>,
    Path(invoice_id): Path<String>,
) -> Result<Json<ReturnFullInvoice>, StatusCode> {
    let db_client = state.db_pool;
    println!("Getting invoice: {}", invoice_id.clone());
    let invoice = sqlx::query_as!(
        Invoice,
        "SELECT * FROM main.invoices WHERE invoice_id = $1",
        invoice_id
    )
    .fetch_one(&db_client)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    let invoice_items = sqlx::query_as!(
        InvoiceItem,
        "SELECT * FROM main.invoice_items WHERE invoice_id = $1",
        invoice_id
    )
    .fetch_all(&db_client)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;
    let client = sqlx::query_as!(
        Client,
        r#" SELECT c.*
                    FROM main.invoices i
                    JOIN main.clients c
                    ON c.client_id = i.client_id
                    WHERE i.invoice_id = $1"#,
        invoice_id
    )
    .fetch_one(&db_client)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;
    let full_invoice = ReturnFullInvoice {
        invoice,
        invoice_items,
        client,
    };
    Ok(Json(full_invoice))
}
/*//get an invoice by invoice_id for the backend

pub async fn get_all_invoice_data(
    tx: &mut Transaction<'_, Postgres>,
    invoice_id: &String,
) -> Result<Json<ReturnFullInvoice>> {
    println!("Getting invoice: {}", invoice_id.clone());
    let invoice = sqlx::query_as!(
        Invoice,
        "SELECT * FROM main.invoices WHERE invoice_id = $1",
        invoice_id
    )
    .fetch_one(&mut **tx)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

    let invoice_items = sqlx::query_as!(
        InvoiceItem,
        "SELECT * FROM main.invoice_items WHERE invoice_id = $1",
        invoice_id
    )
    .fetch_all(&mut **tx)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;
    let client = sqlx::query_as!(
        Client,
        r#" SELECT c.*
                    FROM main.invoices i
                    JOIN main.clients c
                    ON c.client_id = i.client_id
                    WHERE i.invoice_id = $1"#,
        invoice_id
    )
    .fetch_one(&mut **tx)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;
    let full_invoice = ReturnFullInvoice {
        invoice,
        invoice_items,
        client,
    };
    Ok(Json(full_invoice))
}*/
#[derive(Serialize, Deserialize)]
pub struct FindInvoiceQuery {
    client_first_name: Option<String>,
    client_last_name: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    /*#[serde(with = "time::serde::iso8601::option")]
    date: Option<OffsetDateTime>,*/
    year: Option<String>,
    month: Option<String>,
    invoice_number: Option<String>,
    invoice_id: Option<String>,
    client_id: Option<String>,
}
#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
pub struct FoundInvoice {
    invoice_number: i64,
    invoice_id: String,
}
pub(crate) async fn find_invoice(
    State(state): State<AppState>,
    Query(q): Query<FindInvoiceQuery>,
) -> Result<Json<Vec<FoundInvoice>>, StatusCode> {
    let client = &state.db_pool;
    println!("-----FINDING YOUR INVOICE!!!-----");

    /*if (q.client_last_name.is_some()) {
        println!("FIRST NAME: {:?}", q.client_first_name.unwrap());
    }*/
    let mut invoice_number: Option<i64> = None;
    //CONVERT INVOICE NUMBER STRING TO NUMBER
    if q.invoice_number.is_some() {
        invoice_number = q.invoice_number.unwrap_or("".to_string()).parse().ok();
    }
    let mut month: Option<i32> = None;
    //CONVERT MONTH STRING TO NUMBER
    if q.month.is_some() {
        month = q.month.unwrap_or("".to_string()).parse().ok();
    }
    let mut year: Option<i32> = None;
    //CONVERT YEAR NUMBER STRING TO NUMBER
    if q.year.is_some() {
        year = q.year.unwrap_or("".to_string()).parse().ok();
    }

    let mut client_id: Option<String> = None;
    //get client id using first and last name if no client_id is provided
    if q.client_id.is_none()
        && (q.client_first_name.is_some()
            || q.client_last_name.is_some()
            || q.email.is_some()
            || q.phone.is_some())
    {
        let find_client = sqlx::query_scalar!(
            "SELECT client_id FROM main.clients
            WHERE ($1::varchar IS NULL OR first_name ILIKE $1)
            AND ($2::varchar IS NULL OR last_name ILIKE $2)
            AND ($3::varchar IS NULL OR email ILIKE $3::varchar)
            AND ($4::varchar IS NULL OR phone LIKE '%' || $4::varchar)",
            q.client_first_name,
            q.client_last_name,
            q.email,
            q.phone
        )
        .fetch_optional(client)
        .await;
        if find_client.is_ok() {
            client_id = find_client.unwrap();
            println!(
                "CLIENT FOUND!{}",
                client_id.clone().unwrap_or("no client found".to_string())
            );
        }
    } else {
        client_id = q.client_id;
    }
    // Check if all inputs are None before querying
    let all_none = client_id.is_none()
        && invoice_number.is_none()
        && q.invoice_id.is_none()
        && year.is_none()
        && month.is_none();
    if all_none {
        println!("ALL INPUTS ARE NONE!");
        return Ok(Json(vec![])); // Return early without hitting the DB
    }
    let find_invoices = sqlx::query_as!(
        FoundInvoice,
        r#"SELECT invoice_id, invoice_number FROM main.invoices
        WHERE ($1::varchar IS NULL OR client_id = $1)
        AND ($2::bigint IS NULL OR invoice_number = $2::bigint)
        AND ($3::varchar IS NULL OR invoice_id = $3::varchar)
        AND ($4::integer IS NULL OR EXTRACT(YEAR FROM created_at) = $4::integer)
        AND (($5::integer IS NULL OR $4::integer IS NULL) OR EXTRACT(MONTH FROM created_at) = $5::integer)
       "#,
        client_id,
        invoice_number,
        q.invoice_id,
        year,
        month,
    )
    .fetch_all(client)
    .await;
    /*for invoice in find_invoices.iter().clone() {
        println!("FOUND INVOICE: {:?}", invoice);
    }*/
    let found_invoices = Json(find_invoices.unwrap());

    Ok(found_invoices)
}

pub(crate) async fn edit_invoice(
    State(state): State<AppState>,
    Path(invoice_id): Path<String>,
    Json(payload): Json<EditInvoiceInfo>,
) -> Result<(StatusCode, Json<ApiResponse>), (StatusCode, Json<ApiResponse>)> {
    println!("Editing invoice: {}", invoice_id);
    let mut tx = state.db_pool.begin().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                message: format!("Error creating postgres transaction pool: {}", e).to_string(),
            }),
        )
    })?;

    let client = &state.db_pool;

    //if a new billing address is provided, update the client's address
    if payload.address_street.is_some()
        && payload.address_city.is_some()
        && payload.address_state.is_some()
        && payload.address_zip.is_some()
        && payload.address_country.value != ""
    {
        clientele::update_client_address(
            &payload.client_id,
            &payload.address_street.unwrap(),
            &payload.address_city.unwrap(),
            payload.address_state,
            &payload.address_zip.unwrap(),
            &payload.address_country.value,
            &client,
        )
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    message: format!("Error updating client address: {}", e).to_string(),
                }),
            )
        })?;
    }

    //CALCULATE TOTALS
    let mut subtotal = Decimal::zero();
    //calculate subtotal
    for item in &payload.invoice_items {
        subtotal += item.unit_price * Decimal::from(item.quantity);
    }
    //UPDATE INVOICE
    let _edit_invoice = sqlx::query_scalar!(
        r#"UPDATE main.invoices SET amount_subtotal = $1, notes = $2,due_date = $3, payment_completed = $4,
        paid_at = CASE
            WHEN $4 = FALSE THEN NULL
            ELSE $5::timestamptz
        END, amount_tax = $6
        WHERE invoice_id=$7
        "#,
        subtotal,
        payload.notes,
        payload.due_date,
        payload.payment_completed,
        payload.paid_at,
        payload.amount_tax.unwrap_or(Decimal::zero()),
        invoice_id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                message: format!("Error editing Invoice: {}", e).to_string(),
            }),
        )
    });
    //REMOVE ALL OLD INVOICE ITEMS
    remove_all_invoice_items(&mut tx, &invoice_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    message: format!("Error removing old invoice_items from database: {}", e)
                        .to_string(),
                }),
            )
        })?;
    //ADD NEW/EDITED INVOICE ITEMS
    for item in payload.invoice_items {
        create_invoice_item(&mut tx, &invoice_id, item, client)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse {
                        message: format!("Error updating Invoice items into database: {}", e)
                            .to_string(),
                    }),
                )
            })?;
    }

    tx.commit().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                message: format!("Error editing invoice in database: {}", e).to_string(),
            }),
        )
    })?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse {
            message: "Invoice Successfully Updated".to_string(),
        }),
    ))
}
pub(crate) async fn delete_invoice(
    State(state): State<AppState>,
    Json(payload): Json<InvoiceID>,
) -> Result<StatusCode, StatusCode> {
    //TODO delete the invoice and all invoice_items

    Ok(StatusCode::OK)
}

async fn remove_all_invoice_items(
    tx: &mut Transaction<'_, Postgres>,
    invoice_id: &String,
) -> Result<(), sqlx::Error> {
    println!("Removing all invoice items for: {}", invoice_id);
    let _new_invoice_item = sqlx::query!(
        "DELETE FROM main.invoice_items WHERE invoice_id=$1",
        invoice_id,
    )
    .execute(&mut **tx)
    .await?;
    Ok(())
}
