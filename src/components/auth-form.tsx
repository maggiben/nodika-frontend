"use client";

import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type FieldName = "email" | "password" | "token";

type AuthFormProps = {
  action: string;
  fields: FieldName[];
  heading: string;
  submitLabel: string;
  successMessage: string;
};

type AuthFormValues = Record<FieldName, string>;

function labelFor(field: FieldName) {
  switch (field) {
    case "email":
      return "Email address";
    case "password":
      return "Password";
    case "token":
      return "Token";
  }
}

export function AuthForm({
  action,
  fields,
  heading,
  submitLabel,
  successMessage,
}: AuthFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AuthFormValues>({
    defaultValues: { email: "", password: "", token: "" },
  });

  async function submit(values: AuthFormValues) {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/auth/${action}`, {
        body: JSON.stringify(
          Object.fromEntries(fields.map((field) => [field, values[field]])),
        ),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : "We could not complete your request.",
        );
        return;
      }

      if (action === "login" || action === "register") {
        router.push("/");
        router.refresh();
        return;
      }

      setMessage(successMessage);
    } catch {
      setError(
        "The authentication service could not be reached. Try again later.",
      );
    }
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 4, sm: 8 } }}>
      <Paper
        component="section"
        elevation={2}
        sx={{ maxWidth: 480, mx: "auto", p: { xs: 2, sm: 4 } }}
      >
        <Stack component="form" spacing={3} onSubmit={handleSubmit(submit)}>
          <Typography component="h1" variant="h4">
            {heading}
          </Typography>
          {fields.map((field) => (
            <TextField
              {...register(field, {
                required: `${labelFor(field)} is required.`,
                ...(field === "email"
                  ? {
                      pattern: {
                        message: "Enter a valid email address.",
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      },
                    }
                  : {}),
              })}
              autoComplete={
                field === "email"
                  ? "email"
                  : field === "password"
                    ? "current-password"
                    : "off"
              }
              error={Boolean(errors[field])}
              fullWidth
              helperText={errors[field]?.message}
              key={field}
              label={labelFor(field)}
              type={field === "password" ? "password" : "text"}
            />
          ))}
          {error && (
            <Alert aria-live="polite" severity="error">
              {error}
            </Alert>
          )}
          {message && (
            <Alert aria-live="polite" severity="success">
              {message}
            </Alert>
          )}
          <Button
            disabled={isSubmitting}
            size="large"
            type="submit"
            variant="contained"
          >
            {isSubmitting ? "Submitting…" : submitLabel}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
