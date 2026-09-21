export const BASE_URL = 'http://localhost:5000';
export const mainClass = 'flex flex-col items-center gap-8';
export const h1Class = 'text-2xl text-white font-bold';
export const pClass = 'text-xl text-white font-bold';
export const formClass = "flex gap-4 flex-col items-center";
export const labelClass = "w-full text-white font-bold";
export const inputClass = (error) => `p-2 rounded-md border-2 cursor-pointer 
  ${error ? "border-red-400 text-red-500" : "bg-gray-800 text-white"} border-gray-400  w-full`;
export const errorPClass = "text-red-500 p-1 text-xs";
export const submitButtonClass = "w-full p-2 border-4 border-white border-double rounded-md text-white font-bold text-lg bg-gray-700";
export const imageUrl = (filepath) => (filepath ? `${BASE_URL}/${filepath}` : undefined);