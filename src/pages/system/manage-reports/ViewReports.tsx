/* eslint-disable */
/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import { ReportsApi, type GetReportsResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const reportsApi = new ReportsApi(getConfiguration());

const ViewReports = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [report, setReport] = useState<GetReportsResponse>();

  useEffect(() => {
    if (!id || isNaN(Number(id))) return;

    const fetchReport = async () => {
      try {
        const response = await reportsApi.retrieveReport(Number(id), {
          params: { template: true },
        });
        setReport(response.data);
      } catch (err: unknown) {
        console.error("Failed to fetch report details", err);
      }
    };

    fetchReport();
  }, [id]);

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: t("label.anchor.home"), href: "/home" },
          { label: t("label.anchor.system") },
          { label: t("label.anchor.managereports"), href: "/system/reports" },
          { label: `${report?.id ?? ""}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto border border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-end mb-6">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white cursor-pointer px-6"
            onClick={() => navigate(`/system/reports/${report?.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />{" "}
            {t("label.button.edit")}
          </Button>
        </div>

        <h2 className="text-2xl font-bold mb-8 text-zinc-800 dark:text-zinc-100 border-b pb-4">
          {t("label.heading.report")}:{" "}
          <span className="text-[#1074b9]">{report?.reportName}</span>
        </h2>

        <div className="space-y-6 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="flex items-start border-b border-zinc-50 dark:border-zinc-700/50 pb-3">
            <div className="font-semibold w-48 shrink-0 text-zinc-500 dark:text-zinc-400">
              {t("label.heading.reporttype")}:
            </div>
            <div className="font-medium">
              {report?.reportType
                ? t(`label.text.${report.reportType}`, {
                    defaultValue: report.reportType,
                  })
                : ""}
            </div>
          </div>

          <div className="flex items-start border-b border-zinc-50 dark:border-zinc-700/50 pb-3">
            <div className="font-semibold w-48 shrink-0 text-zinc-500 dark:text-zinc-400">
              {t("label.heading.reportcategory")}:
            </div>
            <div className="font-medium">{report?.reportCategory}</div>
          </div>

          <div className="flex items-start border-b border-zinc-50 dark:border-zinc-700/50 pb-3">
            <div className="font-semibold w-48 shrink-0 text-zinc-500 dark:text-zinc-400">
              {t("label.heading.corereport")}:
            </div>
            <div
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                report?.coreReport
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {report?.coreReport ? t("label.boolean.yes") : t("label.boolean.no")}
            </div>
          </div>

          <div className="flex items-start border-b border-zinc-50 dark:border-zinc-700/50 pb-3">
            <div className="font-semibold w-48 shrink-0 text-zinc-500 dark:text-zinc-400">
              {t("label.heading.userreport")}:
            </div>
            <div
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                report?.useReport
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {report?.useReport ? t("label.boolean.yes") : t("label.boolean.no")}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <Button
            variant="outline"
            className="w-32 cursor-pointer border-[#1074b9] text-[#1074b9] hover:bg-blue-50"
            onClick={() => navigate("/system/reports")}
          >
            {t("label.button.back")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewReports;