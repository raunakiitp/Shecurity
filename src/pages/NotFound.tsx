import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-7xl font-bold text-teal/30">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">This page doesn't exist</h1>
      <p className="mt-2 text-muted">It may have been moved, or the link is wrong.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/"><Button>Back to home</Button></Link>
        <Link to="/calculator"><Button variant="ghost">Open calculator</Button></Link>
      </div>
    </div>
  );
}
