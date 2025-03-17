import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { companies as mockCompanies } from '@/data/companies';

interface CompanySearchProps {
  onSelectCompany: (companyId: string) => void;
  currentCompanyId: string | null;
}

export function CompanySearch({ onSelectCompany, currentCompanyId }: CompanySearchProps) {
  const currentCompany = currentCompanyId ? mockCompanies.find(c => c.id === currentCompanyId) : mockCompanies[0];
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Search className="mr-2 h-4 w-4" />
          <span>{currentCompany?.name ?? 'Select a company'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Companies</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search company..." />
          <CommandList>
            <CommandEmpty>No companies found.</CommandEmpty>
            <CommandGroup>
              {mockCompanies.map((company) => (
                <CommandItem
                  key={company.id}
                  onSelect={() => {
                    onSelectCompany(company.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-6 w-6 rounded-full mr-2"
                    />
                    {company.name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
