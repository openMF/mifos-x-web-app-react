import { AppBreadCrumbs } from "@/components/custom/breadcrumbs/AppBreadCrumbs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const Settings = () => {
  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Settings" },
        ]}
      />

      <div className="bg-white p-8 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <Accordion
          type="single"
          collapsible
          className="w-full"
          defaultValue="item-1"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Main Configuration</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <label className="text-sm font-medium">Default Language</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Default Date Format</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd MMMM yyyy">dd MMMM yyyy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Decimals to Display</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select decimals" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Images */}
          <AccordionItem value="item-2">
            <AccordionTrigger>Images</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <p className="font-semibold">Favicon</p>
                <input type="file" />
              </div>
              <div>
                <p className="font-semibold">Cover Image</p>
                <input type="file" />
              </div>
              <div>
                <p className="font-semibold">Logo</p>
                <input type="file" />
              </div>
              <div>
                <p className="font-semibold">Logo with Organization Name</p>
                <input type="file" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Theme and Font */}
          <AccordionItem value="item-3">
            <AccordionTrigger>Theme and Font</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <p className="font-semibold">Theme</p>
                {/* Replace with custom <ThemePicker /> component if needed */}
              </div>
              <div>
                <label className="text-sm font-medium">Default Font</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Choose font" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contact Information */}
          <AccordionItem value="item-4">
            <AccordionTrigger>Contact Information</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              <div>
                <label className="text-sm font-medium">Website</label>
                <Input type="url" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" />
              </div>
              <div>
                <label className="text-sm font-medium">Contact No</label>
                <Input type="tel" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Settings;
