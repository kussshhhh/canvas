

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TextInput = ({ value, onChange }: TextInputProps) => {
  return (
    <div className="text-input-container">
      <label htmlFor="prompt" className="block mb-2 font-medium">
        Describe your phone stand
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="E.g., A phone stand with a 30-degree tilt, charging cable cutout, and sleek minimalist design"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={4}
      />
    </div>
  );
};
