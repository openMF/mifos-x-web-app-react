import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DropdownProps {
  name: React.ReactNode;
  options: string[];
  onSelect?: (value: string) => void;
}

const Dropdown = ({ name, options, onSelect }: DropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex items-center gap-2 px-4 py-2 text-base font-medium text-white bg-[#1074b9] hover:bg-[#0e6aa5] hover:text-white rounded-md transition duration-150"
          variant="ghost"
        >
          {name}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-24 mt-2 rounded-md border border-gray-200 bg-white"
        align="start"
      >
        {options.map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onSelect?.(option)}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Dropdown;
