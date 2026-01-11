use crate::AppState;
use argon2::{
    Argon2,
    password_hash::{
        Error, PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng,
    },
};
use axum::Json;
use axum::extract::{Request, State};
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::Response;
use dotenvy::dotenv;
use serde::Deserialize;
use std::env;
use tower_sessions::Session;

#[derive(serde::Deserialize)]
pub struct LoginInfo {
    username: String,
    password: String,
}
#[derive(Debug, Deserialize)]
pub struct TurnstileResponse {
    pub(crate) success: bool,
    #[serde(default)]
    #[serde(rename = "error-codes")]
    pub(crate) error_codes: Vec<String>,

    // Optional fields Cloudflare may return
    #[serde(default)]
    pub(crate) hostname: Option<String>,
    #[serde(default)]
    pub(crate) action: Option<String>,
    #[serde(default)]
    pub(crate) cdata: Option<String>,
    #[serde(default)]
    pub(crate) challenge_ts: Option<String>,
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    //example test
    fn test_password_hashing() {}
}
//takes in password and returns the hashed password
fn hash_password(password: &str) -> Result<String, Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    // Hash password to PHC string ($argon2id$v=19$...)
    let password_hash = argon2.hash_password(password.as_ref(), &salt)?.to_string();
    let parsed_hash = PasswordHash::new(&password_hash);
    match parsed_hash {
        Ok(hash) => Ok(hash.to_string()),
        Err(e) => Err(e),
    }
}
async fn verify_password(username: &str, password_attempt: &str, state: AppState) -> bool {
    let client = state.db_pool;
    let hashed_password = sqlx::query!(
        "SELECT password FROM main.admin_users WHERE username = $1 ",
        username,
    )
    .fetch_optional(&client)
    .await;
    match hashed_password {
        Ok(user_data) => {
            let hashed_password = user_data.unwrap().password;
            let parsed_hash = PasswordHash::new(&hashed_password).unwrap();
            let argon2 = Argon2::default();
            println!("checking password");
            argon2
                .verify_password(password_attempt.as_bytes(), &parsed_hash)
                .is_ok()
        }
        //INCORRECT USERNAME/NOT FOUND
        Err(_) => false,
    }
}
pub async fn verify_turnstile(
    token: &str,
    remote_ip: Option<&str>,
    expected_action: Option<&str>,
    expected_hostname: Option<&str>,
) -> Result<TurnstileResponse, reqwest::Error> {
    dotenv().expect(".env not found");
    //set env for production vs dev
    let secret: String = env::var("TURNSTILE_SECRET_KEY").unwrap();
    //INITIALIZE DATABASE
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL not found");
    // Basic sanity checks from docs (token max length 2048)
    if token.is_empty() || token.len() > 2048 {
        return Ok(TurnstileResponse {
            success: false,
            error_codes: vec!["invalid-input-response".to_string()],
            hostname: None,
            action: None,
            cdata: None,
            challenge_ts: None,
        });
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()?;

    // Send as application/x-www-form-urlencoded
    let mut form = vec![
        ("secret", secret.to_string()),
        ("response", token.to_string()),
    ];
    if let Some(ip) = remote_ip {
        form.push(("remoteip", ip.to_string()));
    }

    let resp = client
        .post("https://challenges.cloudflare.com/turnstile/v0/siteverify")
        .form(&form)
        .send()
        .await?
        .error_for_status()? // treat non-2xx as error
        .json::<TurnstileResponse>()
        .await?;

    // Optional: enforce action/hostname matching your expectations
    if resp.success {
        if let (Some(exp), Some(got)) = (expected_action, resp.action.as_deref()) {
            if exp != got {
                return Ok(TurnstileResponse {
                    success: false,
                    error_codes: vec!["action-mismatch".to_string()],
                    ..resp
                });
            }
        }
        if let (Some(exp), Some(got)) = (expected_hostname, resp.hostname.as_deref()) {
            if exp != got {
                return Ok(TurnstileResponse {
                    success: false,
                    error_codes: vec!["hostname-mismatch".to_string()],
                    ..resp
                });
            }
        }
    }

    Ok(resp)
}
#[axum::debug_handler]
pub async fn login(
    State(state): State<AppState>,
    session: Session,
    Json(payload): Json<LoginInfo>,
) {
    let username = "admin";
    let password = payload.password;
    match verify_password(&username, &password, state).await {
        true => {
            println!("Login successful!");
            session.insert("user_id", username).await.unwrap();
            session.save().await.unwrap();
        }
        false => println!("Login failed!"),
    }
}
pub async fn logout(session: Session) -> StatusCode {
    println!("Logged out!");
    session.flush().await.unwrap();

    StatusCode::OK
}

// --- Middleware ---
pub async fn auth_gaurd(
    session: Session,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Check if user_id exists in session
    println!("Verifying Auth session");
    if session.is_empty().await {
        println!("This is a fresh/empty session.");
        Err(StatusCode::UNAUTHORIZED)
    } else {
        match session.get::<String>("user_id").await {
            Ok(Some(_)) => {
                println!("Auth successful!");
                Ok(next.run(req).await)
            }
            _ => {
                println!("unauthorized!");

                Err(StatusCode::UNAUTHORIZED)
            }
        }
    }
}
