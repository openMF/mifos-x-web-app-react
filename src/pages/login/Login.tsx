import { Sun, Moon } from "lucide-react";

import mainImg from '@/assets/images/cover_image_resized.webp';
import mifosLogo from '@/assets/images/mifos_lg-logo.png';

import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type RootState, type AppDispatch } from "@/app/store";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/pages/login/loginSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {

    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth)

    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const [form, setForm] = useState({ username: "", password: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(loginUser(form));
    }

    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };


    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full">
            <div className="relative hidden lg:flex lg:w-[70%] h-[400px] lg:h-auto">
                <img src={mainImg} alt="mainImg" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black opacity-60"></div>
                <div className="absolute inset-0 flex flex-col justify-center text-white z-10 px-8 lg:px-16">
                    <h1 className="text-4xl lg:text-6xl font-bold mb-4">Mifos X</h1>
                    <p className="text-lg lg:text-2xl max-w-[100%]">
                        Mifos X is designed by the <a href="https://mifos.org/" className="underline">Mifos Initiative</a>. A <a href="https://mifos.org/resources/community/" className='underline'>global community</a> that aims to speed the elimination of poverty by enabling Organizations to more effectively and efficiently deliver responsible financial services to the world's poor and unbanked. Sounds interesting? <a href="https://mifos.org/take-action/volunteer/" className='underline'>Get involved!</a>
                    </p>
                </div>
            </div>

            <div className="flex flex-col w-full min-h-screen lg:w-[30%] bg-white dark:bg-zinc-900 px-4 py-6 sm:px-10 justify-between">
                <div className="lg:h-[10%] flex flex-wrap gap-2 text-center justify-center">
                    <Select>
                        <SelectTrigger className="w-[160px]">
                            <Label className=" text-zinc-900 dark:text-white">Server</Label>
                            <SelectValue placeholder="https://localhost:8443" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-800 dark:text-white">
                            <SelectGroup>
                                <SelectItem value="sandbox">https://sandbox.mifos.community</SelectItem>
                                <SelectItem value="demo">https://demo.mifos.community</SelectItem>
                                <SelectItem value="fineract">https://localhost:8443</SelectItem>
                                <SelectItem value="frontend">http://localhost:4200</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Select>
                        <SelectTrigger className="w-[140px]">
                            <Label className="text-zinc-900 dark:text-white">Language</Label>
                            <SelectValue placeholder="English" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-800 dark:text-white">
                            <SelectGroup>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Spanish">Español</SelectItem>
                                <SelectItem value="French">Français</SelectItem>
                                <SelectItem value="Nepali">नेपाली</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Button onClick={toggleTheme} variant="outline">
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </Button>
                </div>

                <div className="lg:h-[90%] flex flex-col items-center w-full max-w-md mx-auto">
                    <img src={mifosLogo} alt="mifosLogo" className="h-[130px] m-6" />

                    <Select>
                        <SelectTrigger className="w-full max-w-xs">
                            <Label className="text-zinc-900 dark:text-white">Tenant</Label>
                            <SelectValue placeholder="Default" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-800 dark:text-white">
                            <SelectGroup>
                                <SelectItem value="default">Default</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col items-center mt-6">
                        <Input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            type="text"
                            placeholder="Email"
                            className="dark:bg-zinc-800 dark:text-white mb-4"
                        />

                        <Input
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            type="password"
                            placeholder="Password"
                            className="dark:bg-zinc-800 dark:text-white mb-4"
                        />

                        <div className="flex items-center space-x-2 mb-4">
                            <Checkbox id="terms" />
                            <label htmlFor="terms" className="text-base dark:text-white">Remember me</label>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <Button
                            type="submit"
                            className="w-full text-base bg-sky-600 hover:bg-sky-700 cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </form>

                    <Button variant="ghost" className="m-6 text-base cursor-pointer">Forgot Password?</Button>

                    <div className="flex flex-wrap justify-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className='cursor-pointer'>Resources</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="dark:bg-zinc-800 dark:text-white ">
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className='cursor-pointer'> <a href="https://mifosforge.jira.com/wiki/spaces/docs/pages/52035622/User+Manual">User Manual</a></DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://cwiki.apache.org/confluence/display/FINERACT/Apache+Fineract+1.0+Functional+Specifications">Functional Specifications</a></DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://cwiki.apache.org/confluence/display/FINERACT/Contributor%27s+Zone">Developer Zone</a></DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className='cursor-pointer'>Community</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="dark:bg-zinc-800 dark:text-white">
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://groups.google.com/g/mifosusers"></a>User Group</DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://groups.google.com/g/mifosdeveloper"></a>Developer Group</DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://mifos.org/resources/community/communications/#mifos-irc"></a>IRC</DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className='cursor-pointer'>Contribute</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="dark:bg-zinc-800 dark:text-white">
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://mifosforge.jira.com/wiki/spaces/MDZ/pages/92012624/Key+Design+Principles"></a>Key Design Principles</DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://sourceforge.net/projects/mifos/"></a>Working with code</DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer'><a href="https://mifos.org/take-action/donate-now/"></a>Donate</DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="lg:h-[10%] flex flex-col justify-center items-center mt-10 text-zinc-700 dark:text-zinc-300 text-sm">
                    <p><span className="font-semibold">Mifos:</span> 250518 - cf693b0f</p>
                    <p><span className="font-semibold">Fineract:</span> https://localhost:8443</p>
                </div>
            </div>
        </div>
    )
}

export default Login
