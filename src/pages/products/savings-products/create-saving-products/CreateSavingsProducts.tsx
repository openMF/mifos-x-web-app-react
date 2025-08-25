import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faDollarSign,
  faCalendarAlt,
  faSlidersH,
  faTag,
  faBook,
} from "@fortawesome/free-solid-svg-icons";

import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import AppStepper from "@/components/custom/stepper/AppStepper";
import SavingsProductDetailsStep from "./create-saving-products-stepper/SavingsProductDetailsStep";
import SavingsProductCurrencyStep from "./create-saving-products-stepper/SavingsProductCurrencyStep";
import SavingsProductTermsStep from "./create-saving-products-stepper/SavingsProductTermsStep";
import SavingsProductSettingsStep from "./create-saving-products-stepper/SavingsProductSettingsStep";
import SavingsProductChargesStep from "./create-saving-products-stepper/SavingsProductChargesStep";
import SavingsProductAccountingStep from "./create-saving-products-stepper/SavingsProductAccountingStep";
import { SavingsProductApi, type GetSavingsProductsTemplateResponse } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";

const savingProductApi = new SavingsProductApi(getConfiguration());

const CreateSavingsProducts = () => {

  const [savingProductTemplate, setSavingProductTemplate] = useState<GetSavingsProductsTemplateResponse>();

  useEffect(() => {
    const fetchSavingProductTemplateDetails = async () => {
      try {
        const response = await savingProductApi.retrieveTemplate20();
        setSavingProductTemplate(response.data)
      } catch (err) {
        console.log("Failed to fetch Saving Product Response", err)
      }
    }
    fetchSavingProductTemplateDetails();
  }, [])

  const mapDropdownOptions = <T,>(
    set: Set<T> | undefined,
    mapper: (item: T) => { id: string; name: string }
  ): { id: string; name: string }[] => {
    return Array.from(set ?? []).map(mapper);
  };

  const currencyOptions = Array.from(savingProductTemplate?.currencyOptions ?? []).map((c) => ({
    id: c.code!,
    name: c.name!,
    decimalPlaces: c.decimalPlaces!,
  }));

  const compoundingPeriodOptions = mapDropdownOptions(
    savingProductTemplate?.interestCompoundingPeriodTypeOptions,
    (o) => ({ id: o.id!.toString(), name: o.value! })
  );

  const postingPeriodOptions = mapDropdownOptions(
    savingProductTemplate?.interestPostingPeriodTypeOptions,
    (o) => ({ id: o.id!.toString(), name: o.value! })
  );

  const interestCalculationOptions = mapDropdownOptions(
    savingProductTemplate?.interestCalculationTypeOptions,
    (o) => ({ id: o.id!.toString(), name: o.value! })
  );

  const daysInYearOptions = mapDropdownOptions(
    savingProductTemplate?.interestCalculationDaysInYearTypeOptions,
    (o) => ({ id: o.id!.toString(), name: o.value! })
  );

  const chargeOptions = Array.from(savingProductTemplate?.chargeOptions ?? []).map((o) => ({
    id: o.id!.toString(),
    name: o.name!,
    chargeTimeType: o.chargeTimeType?.description!,
    amount: o.amount!,
    chargeCalculationType: o.chargeCalculationType?.description!,
  }));





  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    description: "",
    currency: {
      code: "USD",
      name: "US Dollar",
      decimalPlaces: 2,
    },
    decimalPlaces: 2,
    currencyMultiples: "",

    nominalAnnualInterestRate: undefined,
    interestCompoundingPeriod: undefined,
    interestPostingPeriod: undefined,
    interestCalculationType: undefined,
    interestCalculationDaysInYearType: undefined,
  });



  const pages = [
    {
      icon: <FontAwesomeIcon icon={faPen} className="text-base" />,
      label: "DETAILS",
      component:
        <SavingsProductDetailsStep
          formData={formData}
          setFormData={setFormData}
        />
    },
    {
      icon: <FontAwesomeIcon icon={faDollarSign} className="text-base" />,
      label: "CURRENCY",
      component:
        <SavingsProductCurrencyStep
          formData={formData}
          setFormData={setFormData}
          currencyOptions={currencyOptions}
        />,
    },
    {
      icon: <FontAwesomeIcon icon={faCalendarAlt} className="text-base" />,
      label: "TERMS",
      component:
        <SavingsProductTermsStep
          formData={formData}
          setFormData={setFormData}
          compoundingPeriodOptions={compoundingPeriodOptions}
          postingPeriodOptions={postingPeriodOptions}
          interestCalculationOptions={interestCalculationOptions}
          daysInYearOptions={daysInYearOptions}
        />,
    },
    {
      icon: <FontAwesomeIcon icon={faSlidersH} className="text-base" />,
      label: "SETTINGS",
      component:
        <SavingsProductSettingsStep
          formData={formData}
          setFormData={setFormData}
        />,
    },
    {
      icon: <FontAwesomeIcon icon={faTag} className="text-base" />,
      label: "CHARGES",
      component: <SavingsProductChargesStep
        formData={formData}
        setFormData={setFormData}
        chargeOptions={chargeOptions}
      />
    },
    {
      icon: <FontAwesomeIcon icon={faBook} className="text-base" />,
      label: "ACCOUNTING",
      component:
        <SavingsProductAccountingStep
          formData={formData}
          setFormData={setFormData}
        />,
    },
  ];

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px] text-zinc-800 dark:text-zinc-200">
      <div className="mb-8">
        <AppBreadCrumbs
          items={[
            { label: "Home", href: "/home" },
            { label: "Products", href: "/products" },
            { label: "Saving Products", href: "/products/saving-products" },
            { label: "Create", current: true },
          ]}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-10">Create Savings Product</h1>
        <AppStepper steps={pages} />
      </div>
    </div>
  );
};

export default CreateSavingsProducts;
