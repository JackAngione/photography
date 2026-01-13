use crate::{AppState, client, invoicing};
use axum::extract::State;
use axum::http::StatusCode;
use axum::{Json, debug_handler};

use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{Error, Postgres};

use crate::auth::verify_turnstile;
use crate::invoicing::ApiResponse;
use time::OffsetDateTime;
//

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
    turnstile_token: String,
}
#[derive(Serialize, Deserialize)]
pub struct BookingRequest {
    first_name: String,
    last_name: String,
    phone: Option<String>,
    email: Option<String>,
    booking_id: String,
    categories: Option<Vec<String>>,
    comments: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    created_at: OffsetDateTime,
    completed: bool,
}

//generates a random 6-character string
//and checks if it's unique against all ID types in the database
pub(crate) async fn generate_id(client: &sqlx::PgPool) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                            abcdefghijklmnopqrstuvwxyz\
                            0123456789";

    loop {
        let new_id: String = {
            let mut rng = rand::rng();
            (0..6)
                .map(|_| {
                    let idx = rng.random_range(0..CHARSET.len());
                    CHARSET[idx] as char
                })
                .collect()
        };
        let invoice_test = sqlx::query!(
            r#"
            SELECT EXISTS (
                SELECT 1 FROM main.invoices  WHERE invoice_id = $1
                UNION ALL
                SELECT 1 FROM main.booking_requests WHERE booking_id = $1
                UNION ALL
                SELECT 1 FROM main.clients WHERE client_id = $1
            ) AS "exists!"
            "#,
            new_id
        )
        .fetch_one(client)
        .await;
        if !invoice_test.unwrap().exists {
            return new_id;
        }
    }
}

#[axum::debug_handler]
pub async fn create_booking_request(
    State(state): State<AppState>,
    Json(payload): Json<IncomingBookingRequest>,
) -> Result<(StatusCode, Json<String>), (StatusCode, Json<String>)> {
    //get client_id from the database
    println!("creating booking request");
    println!("turnstile token: {}", payload.turnstile_token);
    let client = state.db_pool;
    let new_booking_id = generate_id(&client).await;
    //VERIFY TURNSTILE TOKEN
    let turnstile = verify_turnstile(payload.turnstile_token.as_str(), None, None, None)
        .await
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json("FAILED TO VERIFY TURNSTILE TOKEN"),
            )
        });
    if (!turnstile.unwrap().success) {
        println!("turnstile token failed verification");
        return Err((
            StatusCode::UNAUTHORIZED,
            Json("FAILED TO VERIFY TURNSTILE TOKEN".to_string()),
        ));
    }

    // Extract just the values from categories array
    let category_values: Vec<String> = payload
        .categories
        .iter()
        .map(|opt| opt.value.clone())
        .collect();
    //create new booking request in database
    let current_utc = OffsetDateTime::now_utc();
    let create_booking = sqlx::query!(
                "INSERT INTO main.booking_requests (booking_id, created_at, first_name, last_name, phone, email, categories, comments, completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                new_booking_id,
                current_utc,
                payload.first_name,
                payload.last_name,
                payload.phone,
                payload.email,
                &category_values,
                payload.comments.unwrap_or("".to_string()),
                false
    )
        .fetch_optional(&client)
        .await;
    match create_booking {
        Ok(_) => {
            println!("booking request created successfully!");
            Ok((
                StatusCode::CREATED,
                Json("Booking request created!".to_string()),
            ))
        }
        Err(e) => {
            println!("Error creating booking request: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("ERROR: Booking request Not Created!".to_string()),
            ))
        }
    }
}
pub async fn get_pending_bookings(
    State(state): State<AppState>,
) -> Result<Json<Vec<BookingRequest>>, StatusCode> {
    let client = state.db_pool;

    let pending_bookings = sqlx::query_as!(
        BookingRequest,
        "SELECT * FROM main.booking_requests WHERE NOT completed ORDER BY created_at;"
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

//using a booking_id, return existing client_id if it exists, otherwise create a new one
pub async fn client_from_booking(booking_id: &str, client: &sqlx::PgPool) -> String {
    //pull up booking request from given booking_id
    let booking_info = sqlx::query_as!(
        BookingRequest,
        "SELECT   first_name,
        last_name,
        phone,
        email,
        booking_id,
        categories,
        comments,
        created_at,
        completed FROM main.booking_requests WHERE booking_id = $1",
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
                "INSERT INTO main.clients (client_id, first_name, last_name, phone, email, created_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (email)
DO UPDATE SET email = clients.email
RETURNING client_id;",
                new_client_id,
                booking_data.first_name,
                booking_data.last_name,
                booking_data.phone,
                booking_data.email,

                OffsetDateTime::now_utc(),
            )
                .fetch_optional(client)
                .await;
            match client_data {
                Ok(client) => client.unwrap().client_id,
                Err(_) => {
                    panic!("error creating new client");
                }
            }
        }
        Err(_) => panic!("error retrieving booking info"),
    }
}
pub async fn booking_exists(
    booking_id: &str,
    database: &sqlx::PgPool,
) -> Result<bool, sqlx::Error> {
    //TODO CHECK IF new_client IS ALREADY IN DATABASE
    let booking_exists = sqlx::query_scalar!(
        "SELECT EXISTS (SELECT 1 FROM main.booking_requests WHERE booking_id = $1) ",
        booking_id
    )
    .fetch_one(database)
    .await
    .expect("DB error");

    Ok(booking_exists.unwrap())
}
