use crate::booking::client_from_booking;
use crate::client::client_exists;
use crate::{AppState, booking, client, invoicing};
use axum::extract::State;
use axum::http::StatusCode;
use axum::{Json, debug_handler};
use rust_decimal::Decimal;
use rust_decimal::prelude::Zero;
use serde::{Deserialize, Serialize};
use sqlx::{Executor, Postgres, Transaction};
use time::OffsetDateTime;

#[derive(Serialize, Deserialize)]
struct InvoiceID {
    invoice_id: String,
}
#[derive(Serialize, Deserialize)]
pub struct GetInvoice {
    booking_id: Option<String>,
    invoice_id: Option<String>,
}
#[derive(Serialize, Deserialize)]
struct InvoiceItem {
    invoice_id: String,
    invoice_item_id: String,
    description: String,
    quantity: i32,
    unit_price: Decimal,
}
#[derive(Serialize, Deserialize)]
struct NewInvoiceItem {
    description: String,
    quantity: i32,
    unit_price: Decimal,
}

#[derive(Serialize, Deserialize)]
pub struct ApiResponse {
    message: String,
}

#[derive(Serialize, Deserialize)]
pub struct NewInvoiceInfo {
    client_id: Option<String>,
    booking_id: Option<String>,
    invoice_items: Vec<NewInvoiceItem>,
    notes: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    due_date: OffsetDateTime,
    address_street: Option<String>,
    address_city: Option<String>,
    address_state: Option<StateCountry>,
    address_zip: Option<String>,
    address_country: StateCountry,
}

//Invoice from POSTGRES database
#[derive(Serialize, Deserialize)]
pub struct Invoice {
    client_id: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    created_at: OffsetDateTime,
    amount_subtotal: Option<rust_decimal::Decimal>,
    payment_method: Option<String>,
    notes: Option<String>,
    amount_tax: Option<rust_decimal::Decimal>,
    amount_total: Option<rust_decimal::Decimal>,
    booking_id: Option<String>,
    invoice_id: String,
    due_date: Option<OffsetDateTime>,
    payment_completed: bool,
    #[serde(with = "time::serde::iso8601::option")]
    paid_at: Option<OffsetDateTime>,
    invoice_number: i64,
}
#[derive(Serialize, Deserialize)]
struct StateCountry {
    value: String,
    label: String,
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
            client::client_from_booking(&booking_id, &client)
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
        && payload.address_city.is_some()
        && payload.address_state.is_some()
        && payload.address_zip.is_some()
        && payload.address_country.value != ""
    {
        client::update_client_address(
            &client_id,
            &payload.address_street.unwrap(),
            &payload.address_city.unwrap(),
            &payload.address_state.unwrap().value,
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
        "INSERT INTO main.invoices (invoice_id, client_id, created_at, amount_subtotal, notes, booking_id,due_date) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        new_invoice_id,
        client_id,
        OffsetDateTime::now_utc(),
        subtotal,
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
        subtotal += item.unit_price * Decimal::from(item.quantity);
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
/*async fn create_invoice_item(
    invoice_id: &String,
    item: NewInvoiceItem,
    client: Executor,
) -> Result<(), sqlx::Error> {
    let new_invoice_item_id = booking::generate_id(&client).await;
    let _new_invoice_item = sqlx::query_scalar!(

        "INSERT INTO main.invoice_items (invoice_id, invoice_item_id, description, quantity, unit_price ) VALUES ($1, $2, $3, $4, $5)",
        invoice_id,
        new_invoice_item_id,
        item.description,
        item.quantity,
        item.unit_price
    )
        .execute(client)
        .await;
    Ok(())
}*/

//get invoice by booking_id or invoice_id
#[debug_handler]
pub async fn get_invoice(
    State(state): State<AppState>,
    Json(payload): Json<GetInvoice>,
) -> Result<Json<invoicing::Invoice>, StatusCode> {
    let client = state.db_pool;

    let existing_invoice;
    if payload.booking_id.is_some() {
        existing_invoice = sqlx::query_as!(
            Invoice,
            "SELECT client_id, created_at, amount_subtotal, payment_method, notes, amount_tax, amount_total, booking_id, invoice_id, payment_completed,paid_at, due_date, invoice_number FROM main.invoices WHERE booking_id = $1",
            payload.booking_id.as_deref().unwrap()
        )
            .fetch_optional(&client)
            .await;
    } else {
        existing_invoice = sqlx::query_as!(
            Invoice,
            "SELECT client_id, created_at, amount_subtotal, payment_method, notes, amount_tax, amount_total, booking_id, invoice_id, due_date, payment_completed, paid_at, invoice_number FROM main.invoices WHERE invoice_id = $1",
            payload.invoice_id.as_deref().unwrap()
        )
            .fetch_optional(&client)
            .await;
    }
    match existing_invoice {
        //check if the invoice exists
        Ok(invoice) => match invoice {
            Some(invoice) => {
                println!("invoice Found!");
                Ok(Json(invoice))
            }
            None => {
                println!("invoice not found");
                Err(StatusCode::NOT_FOUND)
            }
        },
        //error retrieving invoice
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub(crate) async fn delete_invoice(
    State(state): State<AppState>,
    Json(payload): Json<InvoiceID>,
) -> Result<StatusCode, StatusCode> {
    //TODO delete the invoice and all invoice_items
    Ok(StatusCode::OK)
}
