FROM alpine:latest AS certs
RUN apk add --no-cache ca-certificates

FROM scratch
WORKDIR /app
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY /target/x86_64-unknown-linux-musl/release/photography_backend /app/photography_backend
# Expose the port that the application listens on.
EXPOSE 4272
CMD ["/app/photography_backend"]