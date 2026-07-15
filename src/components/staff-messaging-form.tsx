"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";

type StaffContact = {
  _id: string;
  phone: string;
  label?: string;
  active?: boolean;
};

type StaffTemplate = {
  key: string;
  name: string;
  description?: string;
  body?: { text?: string };
  active?: boolean;
  source?: string;
};

const TEMPLATE_TOKENS = [
  "percent",
  "duration",
  "avance",
  "notes",
  "week",
  "ciclo_name",
  "ciclo_inicio",
  "ciclo_fin",
] as const;

const DEFAULT_TEMPLATE_KEY = "weekly_status";
const DEFAULT_TEMPLATE_BODY =
  "Ciclo {{ciclo_inicio}} → {{ciclo_fin}}\nSemana {{week}}: {{percent}}%\nDuración: {{duration}}\nAvance: {{avance}}\nNotas: {{notes}}";

export function StaffMessagingForm() {
  const { locale, t } = useDictionary();
  const [contacts, setContacts] = useState<StaffContact[]>([]);
  const [templates, setTemplates] = useState<StaffTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | null>(null);

  const [templateKey, setTemplateKey] = useState(DEFAULT_TEMPLATE_KEY);
  const [templateName, setTemplateName] = useState("Estado semanal");
  const [templateBody, setTemplateBody] = useState(DEFAULT_TEMPLATE_BODY);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  const [testContactId, setTestContactId] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact._id === testContactId) ?? null,
    [contacts, testContactId],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [contactsResponse, templatesResponse] = await Promise.all([
          fetch("/api/messaging/contacts"),
          fetch(`/api/messaging/templates?language=${locale}`),
        ]);

        const contactsBody: unknown = await contactsResponse
          .json()
          .catch(() => null);
        const templatesBody: unknown = await templatesResponse
          .json()
          .catch(() => null);

        if (!contactsResponse.ok || !templatesResponse.ok) {
          const message =
            (typeof contactsBody === "object" &&
              contactsBody !== null &&
              "message" in contactsBody &&
              typeof contactsBody.message === "string" &&
              contactsBody.message) ||
            (typeof templatesBody === "object" &&
              templatesBody !== null &&
              "message" in templatesBody &&
              typeof templatesBody.message === "string" &&
              templatesBody.message) ||
            t("staff.loadError");
          if (!cancelled) {
            setError(message);
          }
          return;
        }

        if (!cancelled) {
          const nextContacts = Array.isArray(contactsBody)
            ? (contactsBody as StaffContact[])
            : [];
          setContacts(nextContacts);
          if (nextContacts[0]?._id) {
            setTestContactId(nextContacts[0]._id);
          }

          const nextTemplates = Array.isArray(templatesBody)
            ? (templatesBody as StaffTemplate[])
            : [];
          setTemplates(nextTemplates);
          const selected =
            nextTemplates.find((item) => item.key === DEFAULT_TEMPLATE_KEY) ??
            nextTemplates[0];
          if (selected) {
            setTemplateKey(selected.key);
            setTemplateName(selected.name);
            setTemplateBody(selected.body?.text ?? DEFAULT_TEMPLATE_BODY);
          }
        }
      } catch {
        if (!cancelled) {
          setError(t("staff.unreachable"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  async function saveContact() {
    setSavingContact(true);
    setContactMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/messaging/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          label: label.trim() || undefined,
          active: true,
          tags: ["staff"],
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("staff.contactSaveError"),
        );
        return;
      }

      const contact = body as StaffContact;
      setContacts((current) => [contact, ...current]);
      setTestContactId(contact._id);
      setPhone("");
      setLabel("");
      setContactMessage(t("staff.contactSaved"));
    } catch {
      setError(t("staff.unreachable"));
    } finally {
      setSavingContact(false);
    }
  }

  async function saveTemplate() {
    setSavingTemplate(true);
    setTemplateMessage(null);
    setError(null);
    try {
      const exists = templates.some((item) => item.key === templateKey);
      const payload = {
        ...(exists
          ? {}
          : {
              key: templateKey,
              name: templateName,
            }),
        name: templateName,
        description: t("staff.templateDescription"),
        body: {
          text: templateBody,
          widgets: [],
        },
        active: true,
      };

      const response = await fetch(
        exists
          ? `/api/messaging/templates/${encodeURIComponent(templateKey)}`
          : "/api/messaging/templates",
        {
          method: exists ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("staff.templateSaveError"),
        );
        return;
      }

      const template = body as StaffTemplate;
      setTemplates((current) => {
        const without = current.filter((item) => item.key !== template.key);
        return [template, ...without];
      });
      setTemplateMessage(t("staff.templateSaved"));
    } catch {
      setError(t("staff.unreachable"));
    } finally {
      setSavingTemplate(false);
    }
  }

  async function sendTest() {
    if (!selectedContact) {
      setTestError(t("staff.testNoContact"));
      return;
    }

    setTesting(true);
    setTestError(null);
    setTestMessage(null);
    try {
      const response = await fetch("/api/messaging/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedContact.phone,
          templateKey,
          language: locale,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTestError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("staff.testError"),
        );
        return;
      }
      setTestMessage(t("staff.testSent"));
    } catch {
      setTestError(t("staff.unreachable"));
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>{t("staff.loading")}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4">
            {t("staff.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t("staff.description")}
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("staff.contactsTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("staff.contactsDescription")}
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <TextField
              label={t("staff.contactLabel")}
              onChange={(event) => setLabel(event.target.value)}
              value={label}
            />
            <TextField
              label={t("staff.contactPhone")}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="54911..."
              value={phone}
            />
            <Button
              disabled={savingContact || phone.trim().length < 8}
              onClick={saveContact}
              variant="contained"
            >
              {savingContact ? t("staff.saving") : t("staff.saveContact")}
            </Button>
            {contactMessage ? (
              <Alert severity="success">{contactMessage}</Alert>
            ) : null}
          </Stack>

          <Stack spacing={1} sx={{ mt: 3 }}>
            {contacts.length === 0 ? (
              <Typography color="text.secondary">
                {t("staff.noContacts")}
              </Typography>
            ) : (
              contacts.map((contact) => (
                <Typography key={contact._id}>
                  {contact.label ? `${contact.label} · ` : ""}
                  {contact.phone}
                </Typography>
              ))
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("staff.templateTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("staff.templateHelp")}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label={t("staff.templateKey")}
              onChange={(event) => setTemplateKey(event.target.value)}
              value={templateKey}
            />
            <TextField
              label={t("staff.templateName")}
              onChange={(event) => setTemplateName(event.target.value)}
              value={templateName}
            />
            <TextField
              label={t("staff.templateBody")}
              minRows={6}
              multiline
              onChange={(event) => setTemplateBody(event.target.value)}
              value={templateBody}
            />
            <Box>
              <Typography variant="subtitle2">{t("staff.legendTitle")}</Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {TEMPLATE_TOKENS.map((token) => (
                  <Typography key={token} color="text.secondary">
                    {`{{${token}}}`} — {t(`staff.tokens.${token}`)}
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Button
              disabled={savingTemplate || templateBody.trim().length === 0}
              onClick={saveTemplate}
              variant="contained"
            >
              {savingTemplate ? t("staff.saving") : t("staff.saveTemplate")}
            </Button>
            {templateMessage ? (
              <Alert severity="success">{templateMessage}</Alert>
            ) : null}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("staff.testTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("staff.testDescription")}
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 420 }}>
            <FormControl size="small">
              <InputLabel id="staff-test-contact-label">
                {t("staff.testContact")}
              </InputLabel>
              <Select
                label={t("staff.testContact")}
                labelId="staff-test-contact-label"
                onChange={(event) => setTestContactId(event.target.value)}
                value={testContactId}
              >
                {contacts.map((contact) => (
                  <MenuItem key={contact._id} value={contact._id}>
                    {contact.label
                      ? `${contact.label} (${contact.phone})`
                      : contact.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              disabled={testing || contacts.length === 0}
              onClick={sendTest}
              variant="outlined"
            >
              {testing ? t("staff.testing") : t("staff.sendTest")}
            </Button>
            {testError ? <Alert severity="error">{testError}</Alert> : null}
            {testMessage ? (
              <Alert severity="success">{testMessage}</Alert>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
