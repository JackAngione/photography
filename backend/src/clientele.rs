use crate::booking::{BookingRequest, FindBookingQuery, FoundBooking, generate_id};
use crate::invoicing::invoice::{ApiResponse, EditInvoiceInfo, NewInvoiceInfo, StateCountry};
use crate::{AppState, clientele};
use axum::extract::{Path, Query, State};
use axum::{Json, debug_handler};
use http::StatusCode;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

// Client Data from POSTGRES database
#[derive(Serialize, Deserialize)]
pub(crate) struct Client {
    pub(crate) client_id: String,
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) phone: Option<String>,
    pub(crate) email: String,
    pub(crate) address_street: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    pub(crate) created_at: OffsetDateTime,
    pub(crate) address_city: Option<String>,
    pub(crate) address_state: Option<String>,
    pub(crate) address_zip: Option<String>,
    pub(crate) address_country: Option<String>,
    //IANA timezone string "America/Los_Angeles"
    pub(crate) timezone: Option<String>,
}

//check if client_id exists in database
pub async fn client_exists(client_id: &str, database: &sqlx::PgPool) -> Result<bool, sqlx::Error> {
    let user_exists = sqlx::query_scalar!(
        "SELECT EXISTS (SELECT 1 FROM main.clients WHERE client_id = $1) ",
        client_id
    )
    .fetch_one(database)
    .await
    .expect("DB error");

    Ok(user_exists.unwrap())
}

//using a booking_id, return existing client_id if it exists, otherwise create a new one
pub async fn create_client_from_booking(
    booking_id: &str,
    client: &sqlx::PgPool,
) -> Result<String, sqlx::Error> {
    //pull up booking request from given booking_id
    let booking_info = sqlx::query!(
        r#"SELECT first_name, last_name, phone, email, timezone
        FROM main.booking_requests WHERE booking_id = $1"#,
        booking_id
    )
    .fetch_optional(client)
    .await;
    match booking_info {
        Ok(booking) => {
            let booking_data = booking.unwrap();
            let new_client_id = generate_id(&client).await;

            //tries to insert a new client into the database, if it already exists, returns the client_id
            let client_data = sqlx::query!(
                r#"INSERT INTO main.clients (client_id, first_name, last_name, phone, email, timezone, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   ON CONFLICT (email)
                   DO UPDATE SET email = clients.email
                   RETURNING client_id;"#,
                new_client_id,
                booking_data.first_name,
                booking_data.last_name,
                booking_data.phone,
                booking_data.email,
                booking_data.timezone,
                OffsetDateTime::now_utc(),
            )
                .fetch_optional(client)
                .await;
            match client_data {
                Ok(client) => Ok(client.unwrap().client_id),
                Err(e) => Err(e),
            }
        }
        Err(e) => Err(e),
    }
}
pub async fn update_client_address(
    client_id: &str,
    address_street: &str,
    address_city: &str,
    address_state: Option<StateCountry>,
    address_zip: &str,
    address_country: &str,
    database: &sqlx::PgPool,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"UPDATE main.clients SET  address_street =$1,
        address_city =$2 ,
        address_state =$3,
        address_zip =$4,
        address_country =$5
        WHERE client_id = $6"#,
        address_street,
        address_city,
        //unnecessarily complicated way to convert an empty State into a postgres NULL value
        Some(
            address_state
                .unwrap_or(StateCountry {
                    value: "".into(),
                    label: "".into()
                })
                .value
        )
        .filter(|v| !v.is_empty()),
        address_zip,
        address_country,
        client_id,
    )
    .execute(database)
    .await?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub(crate) struct FindClientQuery {
    pub(crate) client_id: Option<String>,
    pub(crate) first_name: Option<String>,
    pub(crate) last_name: Option<String>,
    pub(crate) email: Option<String>,
    pub(crate) phone: Option<String>,
}
#[derive(Serialize, Deserialize)]
pub(crate) struct FoundClient {
    client_id: String,
    first_name: Option<String>,
    last_name: Option<String>,
}
pub async fn find_client(
    State(state): State<AppState>,
    Query(q): Query<FindClientQuery>,
) -> Result<Json<Vec<FoundClient>>, StatusCode> {
    let db_client = &state.db_pool;
    // Check if all inputs are None before querying
    if q.client_id.is_none()
        && q.first_name.is_none()
        && q.last_name.is_none()
        && q.email.is_none()
        && q.phone.is_none()
    {
        println!("ALL Client queries ARE NONE!");
        return Ok(Json(vec![])); // Return early without hitting the DB
    }
    //phone number matches with or without country code
    let find_clients = sqlx::query_as!(
        FoundClient,
        r#"SELECT client_id, first_name, last_name FROM main.clients
        WHERE ($1::varchar IS NULL OR client_id ILIKE $1::varchar)
        AND ($2::varchar IS NULL OR first_name ILIKE $2::varchar)
        AND ($3::varchar IS NULL OR last_name ILIKE $3::varchar)
        AND ($4::varchar IS NULL OR email ILIKE $4::varchar)
        AND ($5::varchar IS NULL OR phone LIKE '%' || $5::varchar)

       "#,
        q.client_id,
        q.first_name,
        q.last_name,
        q.email,
        q.phone,
    )
    .fetch_all(db_client)
    .await
    .map_err(|e| {
        println!("Error finding client: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR)
    })?;
    let found_clients = Json(find_clients);
    Ok(found_clients)
}

pub async fn view_client(
    State(state): State<AppState>,
    Path(client_id): Path<String>,
) -> Result<Json<Client>, StatusCode> {
    let db_client = state.db_pool;

    let client_info = sqlx::query_as!(
        Client,
        "SELECT * FROM main.clients WHERE client_id = $1",
        client_id
    )
    .fetch_one(&db_client)
    .await;
    match client_info {
        Ok(client_info) => Ok(Json(client_info)),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}
#[derive(Serialize, Deserialize)]
pub(crate) struct EditClientInfo {
    pub(crate) client_id: String,
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) phone: Option<String>,
    pub(crate) email: String,
    pub(crate) address_street: Option<String>,
    pub(crate) address_city: Option<String>,
    pub(crate) address_state: Option<String>,
    pub(crate) address_zip: Option<String>,
    pub(crate) address_country: Option<String>,
    //IANA timezone string "America/Los_Angeles"
    pub(crate) timezone: Option<String>,
}
pub(crate) async fn edit_invoice(
    State(state): State<AppState>,
    Path(client_id): Path<String>,
    Json(payload): Json<EditClientInfo>,
) -> Result<(StatusCode, Json<ApiResponse>), (StatusCode, Json<ApiResponse>)> {
    println!("Editing Client: {}", client_id);

    let client = &state.db_pool;

    //UPDATE CLIENT
    let _edit_client = sqlx::query!(
        r#"UPDATE main.clients SET first_name=$1, last_name=$2,email=$3, phone=$4,
        address_street=$5, address_city=$6, address_state=$7, address_zip=$8, address_country=$9,
         timezone=$10

        WHERE client_id=$11
        "#,
        payload.first_name,
        payload.last_name,
        payload.email,
        payload.phone,
        payload.address_street,
        payload.address_city,
        payload.address_state,
        payload.address_zip,
        payload.address_country,
        payload.timezone,
        payload.client_id,
    )
    .execute(client)
    .await
    .map_err(|e| {
        println!("ERROR! {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                message: format!("Error editing Client: {}", e).to_string(),
            }),
        )
    });
    println!("Client Updated! {}", _edit_client?.rows_affected());
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse {
            message: "Client Successfully Updated".to_string(),
        }),
    ))
}
#[derive(Serialize, Deserialize)]
pub struct NewClient {
    first_name: String,
    last_name: String,
    email: String,
    phone: Option<String>,
    address_street: Option<String>,
    address_city: Option<String>,
    address_state: Option<String>,
    address_zip: Option<String>,
    address_country: Option<String>,
    timezone: Option<String>,
}
//manually create a client
pub async fn create_client(
    State(state): State<AppState>,
    Json(payload): Json<NewClient>,
) -> Result<(StatusCode, Json<ApiResponse>), (StatusCode, Json<ApiResponse>)> {
    println!("Creating new Client");
    let db_client = &state.db_pool;
    let client_id = generate_id(db_client).await;
    //insert the new client into the database
    let _new_client = sqlx::query_scalar!(
        r#"INSERT INTO main.clients (client_id, created_at, first_name, last_name,
        email, phone, address_street, address_city, address_state, address_zip, address_country, timezone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)"#,
        client_id,
        OffsetDateTime::now_utc(),
        payload.first_name,
        payload.last_name,
        payload.email,
        payload.phone,
        payload.address_street,
        payload.address_city,
        payload.address_state,
        payload.address_zip,
        payload.address_country,
        payload.timezone,
    ).fetch_one(db_client)
        .await.map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ApiResponse {
            message: format!("Error creating new Client: {}", e).to_string(),
        }),
    ));
    //return the new client_id as a response
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse {
            message: format!("New Client Successfully Created with Client_ID: {client_id}",)
                .to_string(),
        }),
    ))
}
