import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface DropdownOption {
  label: string;
  path?: string;
  disabled?: boolean;
  onClick?:()=>void;
  children?: DropdownOption[];
}

interface DropdownProps {
  name: React.ReactNode;
  options: DropdownOption[];
  onSelect?: (path?: string) => void;
}

const Dropdown = ({ name, options, onSelect }: DropdownProps) => {
  const navigate = useNavigate();

  const handleSelect = (path?: string) => {
    if (onSelect) {
      onSelect(path);
    } else if (path) {
      navigate(`/${path}`);
    }
  };

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
        className="w-44 mt-2 rounded-md border border-gray-200 bg-white"
        align="start"
      >
        {options.map((option, index) =>
          option.children ? (
            <DropdownMenuSub key={index}>
              <DropdownMenuSubTrigger className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                {option.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-white border">
                {option.children.map((child, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => handleSelect(child.path)}
                    disabled={child.disabled}
                    className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    {child.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem
              key={index}
              onClick={() => handleSelect(option.path)}
              disabled={option.disabled}
              className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              {option.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Dropdown;
