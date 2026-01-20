use crate::{AppState, booking};
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::{Json, debug_handler};

use rand::Rng;
use serde::{Deserialize, Serialize};

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
pub(crate) struct BookingRequest {
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
    booking_number: i64,
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
        booking::BookingRequest,
        "SELECT * FROM main.booking_requests WHERE NOT completed ORDER BY created_at;"
    )
    .fetch_all(&client)
    .await;
    match pending_bookings {
        Ok(bookings) => Ok(Json(bookings)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
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

#[derive(Debug, Deserialize, Serialize)]
pub struct BookingComplete {
    completed: bool,
}
//Mark a booking as completed in the database
pub async fn change_completion_status(
    State(state): State<AppState>,
    Path(booking_id): Path<String>,
    Json(payload): Json<BookingComplete>,
) -> Result<(StatusCode, Json<String>), (StatusCode, Json<String>)> {
    let client = &state.db_pool;
    println!("changing booking completion status");
    //change booking completion status in database
    let _change_completion_status = sqlx::query!(
        r#"UPDATE main.booking_requests SET completed = $1
        WHERE booking_id=$2
        "#,
        &payload.completed,
        &booking_id
    )
    .execute(client)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                message: format!("Error changing  completion status: {}", e).to_string(),
            }),
        )
    });
    Ok((
        StatusCode::OK,
        Json("Booking marked as completed!".to_string()),
    ))
}

#[derive(Serialize, Deserialize)]
pub struct FindBookingQuery {
    first_name: Option<String>,
    last_name: Option<String>,
    name: Option<String>,
    year: Option<String>,
    month: Option<String>,
    booking_number: Option<String>,
    booking_id: Option<String>,
    email: Option<String>,
    phone: Option<String>,
}
#[derive(Serialize, Deserialize, sqlx::FromRow, Debug)]
pub struct FoundBooking {
    booking_number: i64,
    booking_id: String,
}
pub(crate) async fn find_booking(
    State(state): State<AppState>,
    Query(q): Query<FindBookingQuery>,
) -> Result<Json<Vec<FoundBooking>>, StatusCode> {
    let client = &state.db_pool;
    println!("-----FINDING YOUR BOOKING REQUEST!!!-----");
    println!("{:?}", q.email);
    let mut booking_number: Option<i64> = None;
    //CONVERT INVOICE NUMBER STRING TO NUMBER
    if (q.booking_number.is_some()) {
        booking_number = q.booking_number.unwrap_or("".to_string()).parse().ok();
    }
    let mut month: Option<i32> = None;
    //CONVERT MONTH STRING TO NUMBER
    if (q.month.is_some()) {
        month = q.month.unwrap_or("".to_string()).parse().ok();
    }
    let mut year: Option<i32> = None;
    //CONVERT YEAR NUMBER STRING TO NUMBER
    if (q.year.is_some()) {
        year = q.year.unwrap_or("".to_string()).parse().ok();
    }

    // Check if all inputs are None before querying
    let all_none = q.first_name.is_none()
        && q.last_name.is_none()
        && q.email.is_none()
        && q.phone.is_none()
        && booking_number.is_none()
        && q.booking_id.is_none()
        && year.is_none()
        && month.is_none();
    if all_none {
        println!("ALL INPUTS ARE NONE!");
        return Ok(Json(vec![])); // Return early without hitting the DB
    }
    //phone number matches with or without country code
    let find_bookings = sqlx::query_as!(
        FoundBooking,
        r#"SELECT booking_id, booking_number FROM main.booking_requests
        WHERE ($1::varchar IS NULL OR first_name ILIKE $1::varchar)
        AND ($2::varchar IS NULL OR email ILIKE $2::varchar)
        AND ($3::varchar IS NULL OR phone LIKE '%' || $3::varchar)
        AND ($4::varchar IS NULL OR last_name ILIKE $4::varchar)
        AND ($5::bigint IS NULL OR booking_number = $5::bigint)
        AND ($6::varchar IS NULL OR booking_id ILIKE $6::varchar)
        AND ($7::integer IS NULL OR EXTRACT(YEAR FROM created_at) = $7::integer)
        AND (($8::integer IS NULL OR $7::integer IS NULL) OR EXTRACT(MONTH FROM created_at) = $8::integer)
       "#,
        q.first_name,
        q.email,
        q.phone,
         q.last_name,
        booking_number,
        q.booking_id,
        year,
        month,
    )
        .fetch_all(client)
        .await.map_err(|e| {
        println!("Error finding booking: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR)
    })?;
    /*for booking in find_bookings.iter().clone() {
        println!("FOUND Booking: {:?}", booking);
    }*/
    let found_bookings = Json(find_bookings);
    Ok(found_bookings)
}

pub async fn view_booking(
    State(state): State<AppState>,
    Path(booking_id): Path<String>,
) -> Result<Json<BookingRequest>, StatusCode> {
    let client = state.db_pool;

    let booking_request = sqlx::query_as!(
        booking::BookingRequest,
        "SELECT * FROM main.booking_requests WHERE booking_id = $1",
        booking_id
    )
    .fetch_one(&client)
    .await;
    match booking_request {
        Ok(booking_request) => Ok(Json(booking_request)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
