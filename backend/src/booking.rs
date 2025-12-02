use crate::AppState;
use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use chrono::{DateTime, FixedOffset, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::Error;
use time::{OffsetDateTime, UtcOffset};

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

//data coming in from user form
#[derive(Serialize, Deserialize)]
pub struct ClientNew {
    first_name: String,
    last_name: String,
    phone: String,
    email: String,
}
#[derive(Serialize, Deserialize)]
pub struct BookingRequest {
    first_name: String,
    last_name: String,
    phone: Option<String>,
    email: Option<String>,
    categories: Option<Vec<String>>,
    comments: Option<String>,
}
//Invoice from POSTGRES database
#[derive(Debug)]
struct Invoice {
    invoice_id: i32,
    client_id: String,
    amount_subtotal: rust_decimal::Decimal,
    billing_address: String,
    payment_method: String,
    notes: String,
    amount_tax: rust_decimal::Decimal,
    created_at: DateTime<Utc>,
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
    Json(payload): Json<BookingRequest>,
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

pub async fn new_booking_request(
    State(state): State<AppState>,
    Json(payload): Json<BookingRequest>,
) -> StatusCode {
    //get client_id from the database
    let client = state.db_pool;
    let mut new_booking_id: String;

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
    //create new booking request in database
    let create_booking = sqlx::query!(
                "INSERT INTO main.booking_requests (booking_id, first_name, last_name, phone, email, categories, comments) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                new_booking_id,
                payload.first_name,
                payload.last_name,
                payload.phone,
                payload.email,
                &payload.categories.unwrap_or(vec![]),
                payload.comments.unwrap_or("".to_string())
            )
        .fetch_optional(&client)
        .await;
    match create_booking {
        Ok(_) => StatusCode::CREATED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}
pub fn generate_invoice() {}

fn generate_invoice_number() {}
