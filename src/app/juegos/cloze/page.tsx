import { ClozeClient } from './ClozeClient';

export default function Page() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-4">Rellena el hueco</h1>
      <ClozeClient />
    </div>
  );
}
