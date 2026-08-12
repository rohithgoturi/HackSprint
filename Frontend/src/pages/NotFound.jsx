import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/Container';
import Button from '../components/Button';
import { FileQuestion, Home, MapPin } from 'lucide-react';

const NotFound = () => {
  return (
    <Container className="max-w-md py-16 font-sans text-left">
      <div className="bg-white border border-civic-border rounded-xl p-8 text-center shadow-civic-normal space-y-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
          <FileQuestion className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
            ERROR 404
          </span>
          <h1 className="text-xl font-extrabold text-[#10213F] tracking-tight">
            PAGE NOT FOUND
          </h1>
          <p className="text-xs text-civic-muted leading-relaxed">
            "THIS PAGE DOESN'T EXIST. Let's get you back to JanSetu AI."
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <Link to="/" className="block">
            <Button variant="primary" size="md" className="w-full font-bold justify-center" icon={Home}>
              GO HOME
            </Button>
          </Link>

          <Link to="/map" className="block">
            <Button variant="secondary" size="md" className="w-full font-semibold justify-center" icon={MapPin}>
              VIEW LIVE MAP
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default NotFound;
