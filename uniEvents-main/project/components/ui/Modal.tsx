import { Button } from "@/components/ui/button"; // Assuming you are using your button component

interface ModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function Modal({ isOpen, message, onClose }: ModalProps) {
  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Alert</h2>
        <p>{message}</p>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
