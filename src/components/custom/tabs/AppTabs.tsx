import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom"

interface Tabs {
    label: string,
    href: string,
}

interface TabsProps {
    tabs: Tabs[]
}


const AppTabs = ({ tabs }: TabsProps) => {

    const navigate = useNavigate();


    return (
        <div className="bg-gray-200 h-10 flex justify-around items-center px-4 space-x-4 text-sm font-medium text-gray-600">
            {tabs.map((tab) => {
                return (
                    <Button
                        key={tab.href}
                        variant="ghost"
                        onClick={()=>navigate(`/${tab.href}`)}
                        className=" hover:bg-transparent dark:hover:bg-transparent border-transparent hover:border-black hover:text-black cursor-pointer"
                    >{tab.label}</Button>
                );
            })}
        </div>
    )
}

export default AppTabs
