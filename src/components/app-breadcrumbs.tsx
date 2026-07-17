"use client";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { useDictionary } from "@/i18n/dictionary-provider";
import { buildBreadcrumbItems } from "@/lib/breadcrumb-routes";

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const { locale, t } = useDictionary();
  const items = buildBreadcrumbItems(pathname, locale);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 0 }}>
      <Breadcrumbs aria-label={t("breadcrumb.ariaLabel")}>
        {items.map((item, index) => {
          const label = t(item.labelKey);
          const isLast = index === items.length - 1;

          if (!isLast && item.href) {
            return (
              <Link
                key={item.labelKey + item.href}
                component={NextLink}
                href={item.href}
                underline="hover"
                color="inherit"
              >
                {label}
              </Link>
            );
          }

          return (
            <Typography key={item.labelKey} color="text.primary">
              {label}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </Container>
  );
}
