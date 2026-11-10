import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, Star, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { PhoneField } from '../components/ui/PhoneField';
import { Select } from '../components/ui/Select';
import { Badge, Toast } from '../components/ui/Bits';
import { useToast } from '../components/ui/useToast';
import { useShecurity } from '../app/shecurity-context';
import { updateUser } from '../app/auth';
import { RELATIONS } from '../lib/constants';
import { uid } from '../lib/format';
import type { Contact } from '../lib/types';

export default function Contacts() {
  const { user, onUserChanged } = useShecurity();
  const navigate = useNavigate();
  const { toast, show } = useToast();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return null;
  const contacts = user.contacts;

  const persist = (next: Contact[]) => {
    const updated = { ...user, contacts: next };
    updateUser(updated);
    onUserChanged(updated);
  };

  const add = () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Enter a name.';
    if (phone.replace(/\D/g, '').length < 8) errs.phone = 'Enter a valid phone number.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    persist([...contacts, { id: uid(), name: name.trim(), relation, phone, email: email || undefined, primary: contacts.length === 0 }]);
    setName('');
    setPhone('');
    setEmail('');
    show('Contact added');
  };

  const remove = (id: string) => {
    const next = contacts.filter((c: Contact) => c.id !== id);
    if (next.length && !next.some((c: Contact) => c.primary)) next[0].primary = true;
    persist(next);
    show('Contact removed');
  };

  const makePrimary = (id: string) => persist(contacts.map((c: Contact) => ({ ...c, primary: c.id === id })));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Trusted contacts</h1>
        <p className="text-sm text-mist">1–5 people alerted in an emergency. One primary contact.</p>
      </div>

      <ul className="space-y-2">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-lineDark/50 bg-surface px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/20 text-teal-light text-sm font-semibold">
                {c.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {c.name} {c.primary && <Star size={13} className="inline text-amber fill-amber" />}
                </p>
                <p className="text-sm text-mist truncate">{c.relation} · +{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {!c.primary && (
                <button onClick={() => makePrimary(c.id)} aria-label={`Make ${c.name} primary`} className="p-2 rounded-lg hover:bg-white/10 text-mist hover:text-amber dark:hover:text-amber">
                  <Star size={16} />
                </button>
              )}
              <button onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`} className="p-2 rounded-lg hover:bg-white/10 text-mist hover:text-coral-light">
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
        {contacts.length === 0 && (
          <li className="rounded-xl border border-dashed border-lineDark p-6 text-center text-sm text-mist">
            No contacts yet — add at least one so alerts have somewhere to go.
          </li>
        )}
      </ul>

      {contacts.length < 5 ? (
        <div className="rounded-2xl border border-lineDark/50 bg-surface p-5 space-y-3">
          <p className="font-medium flex items-center gap-2"><UserPlus size={17} className="text-teal-light" /> Add contact</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            <Select label="Relation" value={relation} onChange={setRelation} options={RELATIONS.map((r) => ({ value: r, label: r }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PhoneField label="Phone (WhatsApp)" value={phone} onChange={setPhone} error={errors.phone} />
            <Field label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          </div>
          <Button onClick={add}>Add contact</Button>
        </div>
      ) : (
        <Badge tone="amber">Maximum of 5 contacts</Badge>
      )}

      <Button variant="ghost" onClick={() => navigate('/dashboard')} icon={<ArrowLeft size={15} />}>
        Back to dashboard
      </Button>
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}
