FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git

RUN go install go.k6.io/xk6/cmd/xk6@v0.11.0

RUN xk6 build v0.54.0 \
    --with github.com/grafana/xk6-output-influxdb@v0.7.0 \
    --output /k6

FROM grafana/k6:0.54.0
COPY --from=builder /k6 /usr/bin/k6