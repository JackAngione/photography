use crate::booking::generate_id;
use time::OffsetDateTime;

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
pub async fn client_from_booking(
    booking_id: &str,
    client: &sqlx::PgPool,
) -> Result<String, sqlx::Error> {
    //pull up booking request from given booking_id
    let booking_info = sqlx::query!(
        r#"SELECT first_name,
        last_name,
        phone,
        email
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
                r#"INSERT INTO main.clients (client_id, first_name, last_name, phone, email, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (email)
                   DO UPDATE SET email = clients.email
                   RETURNING client_id;"#,
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
    address_state: &str,
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
        address_state,
        address_zip,
        address_country,
        client_id,
    )
    .execute(database)
    .await?;
    Ok(())
}
