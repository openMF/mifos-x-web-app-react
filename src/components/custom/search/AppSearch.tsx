import { Input } from "@/components/ui/input";

interface AppSearchProps {
  placeholder: string,
  searchItem: string,
  setsearchItem: (value: string) => void
}

const AppSearch = ({ placeholder, searchItem, setsearchItem }: AppSearchProps) => {

  return (
    <div className="max-w-sm h-11 text-base">
      <Input
        placeholder={placeholder}
        value={searchItem}
        onChange={(e) => {
          setsearchItem(e.target.value);
        }}
      />
    </div>
  )
}

export default AppSearch
