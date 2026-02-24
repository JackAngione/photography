extern crate core;
mod auth;
mod booking;
mod clientele;
mod invoicing;
mod photo_file_ops;

use crate::auth::auth_gaurd;
use crate::invoicing::invoice::{create_invoice, edit_invoice, find_invoice, view_invoice};

use crate::invoicing::invoice_generation::generate_pdf;
use axum::http::{Method, StatusCode, header};
use axum::{Router, middleware, routing::get, routing::post};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::env;
use std::path::Path;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tower_sessions::cookie::time::Duration;
use tower_sessions::{ExpiredDeletion, Expiry, SessionManagerLayer};
use tower_sessions_sqlx_store::PostgresStore;

#[derive(Clone)]
struct AppState {
    db_pool: Pool<Postgres>,
}

#[tokio::main]
async fn main() {
    dotenv().expect(".env not found");
    //set env for production vs dev
    let is_prod = env::var("RUST_STATUS").unwrap_or_else(|_| "development".into()) == "production";
    //INITIALIZE DATABASE
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL not found");
    let postgres_pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&db_url)
        .await
        .unwrap();

    //STATIC FILE SERVING PATHS
    let images_path = Path::new("./server_files/hdr_images");
    let serve_images = ServeDir::new(images_path);

    // Configure CORS middleware to allow all origins
    let cors = CorsLayer::new()
        //.allow_origin(Any) // Allow requests from any origin
        .allow_origin(
            "http://localhost:3000"
                .parse::<axum::http::HeaderValue>()
                .unwrap(),
        )
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        // 3. Allow headers usually sent by React (Content-Type is needed for JSON)
        .allow_headers([axum::http::header::CONTENT_TYPE])
        .allow_credentials(true)
        .expose_headers([
            header::CONTENT_LENGTH,
            header::CONTENT_TYPE,
            header::ACCEPT_RANGES,
        ]);
    //INITIALISE POSTGRES SESSION STORE
    let session_store = PostgresStore::new(postgres_pool.clone())
        //explicitly set schema and table names because default
        //was storing them in somewhere not visible
        .with_schema_name("main")
        .unwrap()
        .with_table_name("sessions")
        .unwrap();

    //AUTOMATIC MIGRATION: This creates the 'sessions' table
    session_store
        .migrate()
        .await
        .expect("Failed to run migrations");

    //(should)CONTINUOUSLY DELETE EXPIRED SESSIONS every 6 hours
    tokio::task::spawn(
        session_store
            .clone()
            .continuously_delete_expired(tokio::time::Duration::from_secs(21600)),
    );

    //Axum Server
    let state = AppState {
        db_pool: postgres_pool,
    };

    // 4. Create the session Layer
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(is_prod) // <--- CRITICAL: Must be TRUE if using HTTPS
        .with_same_site(if is_prod {
            tower_sessions::cookie::SameSite::Strict
        } else {
            tower_sessions::cookie::SameSite::Lax
        })
        .with_expiry(Expiry::OnInactivity(Duration::hours(24)));

    let app = Router::new()
        //INVOICING ROUTES
        .route("/invoicing/view/{invoice_id}", get(view_invoice))
        .route("/invoicing/edit/{invoice_id}", post(edit_invoice))
        .route("/invoicing/find", get(find_invoice))
        .route("/invoicing/create", post(create_invoice))
        .route("/invoicing/print/{invoice_id}", get(generate_pdf))
        //BOOKING ROUTES
        .route("/booking/get_pending", get(booking::get_pending_bookings))
        .route("/booking/view/{booking_id}", get(booking::view_booking))
        .route("/booking/find", get(booking::find_booking))
        .route(
            "/booking/change_completion/{booking_id}",
            post(booking::change_completion_status),
        )
        //CLIENTELE ROUTES
        .route("/clientele/find", get(clientele::find_client))
        .route("/clientele/view/{client_id}", get(clientele::view_client))
        .route("/clientele/edit/{client_id}", post(clientele::edit_invoice))
        .route("/clientele/create", post(clientele::create_client))
        //AUTHENTICATION ROUTES
        .route("/auth/verify", get(|| async { StatusCode::OK }))
        .route_layer(middleware::from_fn(auth_gaurd)) // Protect routes above
        .route("/auth/login", post(auth::login))
        .route("/auth/logout", post(auth::logout))
        //PUBLIC ROUTES
        .route("/getPhotoCategories", get(photo_file_ops::get_categories))
        .route(
            "/category/{category}",
            get(photo_file_ops::get_category_photos),
        )
        .route("/booking/create", post(booking::create_booking_request))
        .layer(session_layer)
        .layer(cors)
        .nest_service("/photo", serve_images) // Static file route
        .with_state(state);

    // run server with hyper, listening globally on port xxxx
    let listener = tokio::net::TcpListener::bind("0.0.0.0:4272").await.unwrap();
    println!("Listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
