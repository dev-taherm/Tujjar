"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@/shared/ui";
import { useUpdateCustomer } from "@/api/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import type { Customer } from "@/shared/types";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const updateCustomer = useUpdateCustomer();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customers", customerId],
    queryFn: async (): Promise<Customer> => {
      const { data } = await apiClient.get(`/customers/${customerId}/`);
      return data;
    },
    enabled: !!customerId,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (customer) {
      setFirstName(customer.first_name);
      setLastName(customer.last_name);
      setPhone(customer.phone);
      setCompany(customer.company);
      setNotes(customer.notes);
      setAddressLine1(customer.address_line1);
      setCity(customer.city);
      setState(customer.state);
      setPostalCode(customer.postal_code);
      setCountry(customer.country);
    }
  }, [customer]);

  const handleSave = async () => {
    await updateCustomer.mutateAsync({
      id: customerId,
      first_name: firstName,
      last_name: lastName,
      phone,
      company,
      notes,
      address_line1: addressLine1,
      city,
      state,
      postal_code: postalCode,
      country,
    });
    router.back();
  };

  if (isLoading) return <div className="h-[400px] animate-pulse rounded-xl bg-gray-200" />;
  if (!customer) return <div className="flex h-96 items-center justify-center"><p className="text-gray-500">Customer not found.</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.first_name} {customer.last_name}</h1>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
        <Button onClick={handleSave} isLoading={updateCustomer.isPending}><Save className="me-2 h-4 w-4" /> Save</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Address</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Address Line 1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal notes about this customer..." />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Orders</span><span className="font-medium">{customer.orders_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Spent</span><span className="font-medium">{formatCurrency(Number(customer.total_spent))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Loyalty Points</span><span className="font-medium">{customer.loyalty_points}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-medium">{formatDateTime(customer.created_at)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
