import mifosLogo from '@/assets/images/image-removebg-preview-transparent.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gauge } from 'lucide-react';

const Home = () => {
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-zinc-900 px-4 flex flex-col items-center justify-start pt-24">
      <h1 className="absolute top-6 left-6 text-lg sm:text-xl font-semibold text-gray-700">
        Welcome to Mifos Home!
      </h1>

      <img
        src={mifosLogo}
        alt="Mifos Logo"
        className="h-28 sm:h-36 md:h-40 mt-10 mb-6 drop-shadow-lg"
      />

      <div className="w-full max-w-xl px-2">
        <Input
          type="text"
          placeholder="Search Activity..."
          className="w-full px-4 sm:px-6 py-3 border border-gray-300 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
        />
      </div>

      <Button
        className="flex items-center gap-2 mt-6 px-4 sm:px-6 py-2 bg-[#76C47A] text-white rounded-lg shadow hover:bg-[#22B24C] transition cursor-pointer text-sm sm:text-base"
      >
        <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
        Dashboard
      </Button>
    </div>
  );
};

export default Home;
