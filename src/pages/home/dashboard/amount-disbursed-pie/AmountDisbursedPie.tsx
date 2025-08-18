import { useEffect, useState } from "react";
import { Pie, PieChart, Cell, Legend } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { RunReportsApi, OfficesApi } from "@/fineract-api";
import { getConfiguration } from "@/lib/fineract-openapi";
import AppSelect from "@/components/custom/select/AppSelect";

const runreportApi = new RunReportsApi(getConfiguration());
const officeApi = new OfficesApi(getConfiguration());

// Bright glowing color palette
const customColors = [
    "#ff4d4f", // neon red
    "#1e90ff", // dodger blue
    "#00cfff", // bright cyan
    "#ff6ec7", // neon pink
    "#00ffcc", // neon mint
    "#ffcc00", // bright yellow
    "#ff1493", // deep pink
    "#00bfff", // deep sky blue
];

const AmountDisbursedPie = () => {
    //state to store the data
    const [officeId, setOfficeId] = useState<number>(1);
    const [officeData, setOfficeData] = useState<{ id: number; name: string }[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartConfig, setChartConfig] = useState<ChartConfig>({});

    //api call to fetch the data for the different offices
    useEffect(() => {
        (async () => {
            const res = await officeApi.retrieveOffices();
            const data = res.data ?? [];
            setOfficeData(data.map((o) => ({ id: o.id!, name: o.name! })));
        })();
    }, []);

    //api to fetch actual chart data
    useEffect(() => {
        (async () => {
            try {
                const res = await runreportApi.runReport("Disbursal Vs Awaitingdisbursal", false, {
                    params: { R_officeId: officeId, genericResultSet: false },
                });

                const rows: any[] = Array.isArray(res.data) ? res.data : [];
                const raw = rows[0];
                if (!raw) {
                    setChartData([]);
                    setChartConfig({});
                    return;
                }

                const dynamicData = Object.entries(raw).map(([key, val], idx) => ({
                    name: key,
                    visitors: Number(val),
                    fill: customColors[idx % customColors.length],
                }));

                const config: ChartConfig = {
                    visitors: { label: "Value" },
                    ...Object.fromEntries(
                        dynamicData.map((d) => [d.name, { label: d.name, color: d.fill }])
                    ),
                };

                setChartData(dynamicData);
                setChartConfig(config);
            } catch (error) {
                console.error("Failed to fetch report data", error);
                setChartData([]);
                setChartConfig({});
            }
        })();
    }, [officeId]);

    const hasNonZero = chartData.some((d) => d.visitors > 0);

    return (
        //main chart card
        <Card className="flex flex-col h-full">
            <CardHeader className="gap-4">
                <div>
                    <CardTitle className="text-xl">Amount Pending / Disbursed</CardTitle>
                    <CardDescription>Select an office to view the chart</CardDescription>
                </div>
                <div className="w-full max-w-sm flex flex-col gap-2">
                    <AppSelect
                        selectLabel="Office"
                        selectValue={officeId.toString()}
                        selectOnChange={(value) => setOfficeId(Number(value))}
                        selectPlaceholder="Select office"
                        selectOptions={
                            (officeData || [])
                                .filter((option) => option.id !== undefined)
                                .map((option) => ({
                                    id: option.id!,
                                    name: option.name!
                                }))
                        }
                    />
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-0">
                {chartData.length > 0 && hasNonZero ? (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[300px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="visitors"
                                nameKey="name"
                                outerRadius={100}
                                stroke="none"
                                label={({ value }) => (value === 0 ? "0" : undefined)}
                            >
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ChartContainer>
                ) : (
                    <p className="text-center text-muted-foreground text-sm mt-4">
                        No pending or disbursed amounts found (all values are 0).
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default AmountDisbursedPie;
