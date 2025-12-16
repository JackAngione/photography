use crate::AppState;
use axum::extract::State;
use axum::http::StatusCode;
use axum::{Json, debug_handler};

use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::Error;

use time::OffsetDateTime;

// Client Data from POSTGRES database
#[derive(Debug)]
struct ClientRegistered {
    client_id: String,
    first_name: String,
    last_name: String,
    phone: Option<String>,
    email: Option<String>,
    address: Option<String>,
    created_at: OffsetDateTime,
}
#[derive(Serialize, Deserialize)]
pub struct BookingID {
    booking_id: String,
}
//data coming in from user form
#[derive(Serialize, Deserialize)]
pub struct ClientNew {
    first_name: String,
    last_name: String,
    phone: String,
    email: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct Category {
    value: String,
    label: String,
}
#[derive(Serialize, Deserialize)]
pub struct IncomingBookingRequest {
    first_name: String,
    last_name: String,
    phone: Option<String>,
    email: Option<String>,
    categories: Vec<Category>,
    comments: Option<String>,
}
#[derive(Serialize, Deserialize)]
pub struct BookingRequest {
    first_name: String,
    last_name: String,
    booking_id: String,
    #[serde(with = "time::serde::iso8601")]
    created_at: OffsetDateTime,
    phone: Option<String>,
    email: Option<String>,
    categories: Option<Vec<String>>,
    comments: Option<String>,
}

//Invoice from POSTGRES database
#[derive(Serialize, Deserialize)]
struct Invoice {
    invoice_id: i32,
    client_id: String,
    #[serde(with = "time::serde::iso8601")]
    created_at: OffsetDateTime,
    amount_subtotal: Option<rust_decimal::Decimal>,
    billing_address: Option<String>,
    payment_method: Option<String>,
    notes: Option<String>,
    amount_tax: Option<rust_decimal::Decimal>,
    amount_total: Option<rust_decimal::Decimal>,
    booking_id: Option<String>,
}
//generates a random 6 character string
fn generate_id() -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                            abcdefghijklmnopqrstuvwxyz\
                            0123456789";
    let mut rng = rand::rng();

    (0..6)
        .map(|_| {
            let idx = rng.random_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}
//take in client info and create new client if doesn't exist
//or return client_id from database if already exists
async fn handle_client(
    State(state): State<AppState>,
    Json(payload): Json<IncomingBookingRequest>,
) -> Result<String, Error> {
    println!(
        "checking if {} {} is in database",
        payload.first_name, payload.last_name
    );
    /* let new_client = ClientNew {
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone.expect("no phone"),
        email: payload.email.expect("no email"),
    };*/
    //TODO CHECK IF new_client IS ALREADY IN DATABASE
    let client = state.db_pool;
    let user_exists = sqlx::query_as!(
        ClientRegistered,
        "SELECT * FROM main.clients WHERE first_name = $1 AND last_name = $2",
        payload.first_name,
        payload.last_name
    )
    .fetch_optional(&client)
    .await
    .expect("DB error");

    match user_exists {
        Some(client) => Ok(client.client_id),
        None => {
            //if no existing client found, create one
            let mut new_client_id: String;
            //generate random client_id and check if it already exists
            loop {
                new_client_id = generate_id();
                let client_exists = sqlx::query!(
                    "SELECT COUNT(*) FROM main.clients WHERE client_id = $1",
                    new_client_id
                )
                .fetch_optional(&client)
                .await
                .unwrap();
                if client_exists.unwrap().count.unwrap() == 0 {
                    break;
                }
            }
            //Create new client in database
            let current_utc = OffsetDateTime::now_utc();
            let create_client = sqlx::query!(
                "INSERT INTO main.clients (client_id, first_name, last_name, phone, email, address, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                new_client_id,
                payload.first_name,
                payload.last_name,
                payload.phone,
                payload.email,
                "",
                current_utc,
            )
                .fetch_optional(&client)
                .await;
            match create_client {
                Ok(_) => {
                    println!("new client created successfully");
                    Ok(new_client_id)
                }
                Err(error) => Err(error),
            }
        }
    }
}

pub async fn create_booking_request(
    State(state): State<AppState>,
    Json(payload): Json<IncomingBookingRequest>,
) -> StatusCode {
    //get client_id from the database
    let client = state.db_pool;
    let mut new_booking_id: String;
    println!("hit!");
    //generate random booking_id and check if it already exists
    loop {
        new_booking_id = generate_id();
        let booking_exists = sqlx::query!(
            "SELECT COUNT(*) FROM main.booking_requests WHERE booking_id = $1",
            new_booking_id
        )
        .fetch_optional(&client)
        .await
        .unwrap();
        if booking_exists.unwrap().count.unwrap() == 0 {
            break;
        }
    }

    // Extract just the values from categories array
    let values: Vec<String> = payload
        .categories
        .iter()
        .map(|opt| opt.value.clone())
        .collect();
    //create new booking request in database
    let current_utc = OffsetDateTime::now_utc();
    let create_booking = sqlx::query!(
                "INSERT INTO main.booking_requests (booking_id, created_at, first_name, last_name, phone, email, categories, comments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                new_booking_id,
                current_utc,
                payload.first_name,
                payload.last_name,
                payload.phone,
                payload.email,
               &values,
                payload.comments.unwrap_or("".to_string())
            )
        .fetch_optional(&client)
        .await;
    match create_booking {
        Ok(_) => StatusCode::CREATED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}
pub async fn get_pending_bookings(
    State(state): State<AppState>,
) -> Result<Json<Vec<BookingRequest>>, StatusCode> {
    let client = state.db_pool;

    let pending_bookings = sqlx::query_as!(
        BookingRequest,
        "SELECT * FROM main.booking_requests ORDER BY created_at;"
    )
    .fetch_all(&client)
    .await;
    match pending_bookings {
        Ok(bookings) => {
            println!("sent json!");
            Ok(Json(bookings))
        }
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
//edit an invoice or create if it doesn't exist
#[debug_handler]
pub async fn edit_invoice(State(state): State<AppState>, Json(payload): Json<BookingID>) {
    let booking_id = payload.booking_id;
    let client = state.db_pool;
    let invoice = sqlx::query_as!(
        Invoice,
        "SELECT * FROM main.invoices WHERE booking_id = $1",
        booking_id
    )
    .fetch_optional(&client)
    .await;
    match invoice {
        Ok(invoice) => {}
        Err(_) => todo!(),
    }
}
async fn create_invoice(booking_id: Option<String>) {}
fn generate_invoice_number() {}
