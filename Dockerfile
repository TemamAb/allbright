# syntax=docker/dockerfile:1
# BrightSky – v2.2 Audit Fixed
FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -
