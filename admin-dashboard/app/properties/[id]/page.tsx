'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addAdminLog, getProperties, updateProperty } from '@/lib/data';
import { Property, ListingStatus } from '@/lib/types';
import { ArrowLeft, CheckCircle, XCircle, Ban, MapPin, Bed, Bath, Car, Home } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createTransactionRecord, generatePaymentReference, processPaystackPaymentFlow } from '@/lib/payments';

async function fetchProperty(id: string): Promise<Property> {
  const properties = await getProperties();
  const property = properties.find((p) => p.id === id);
  if (!property) {
    throw new Error('Property not found');
  }
  return property;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ['property', propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: ListingStatus) => {
      await updateProperty(propertyId, {
        status,
        is_available: status === 'approved',
      });
      await addAdminLog({
        action:
          status === 'approved'
            ? 'approved_property'
            : status === 'rejected'
              ? 'rejected_property'
              : status === 'suspended'
                ? 'suspended_property'
                : 'updated_property',
        entity_type: 'property',
        entity_id: propertyId,
        details: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      router.push('/properties');
    },
  });

  const toggleVerification = useMutation({
    mutationFn: async (isVerified: boolean) => {
      await updateProperty(propertyId, { is_verified: isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const handleVerificationPayment = async () => {
    if (!property) return;
    if (!confirm('Proceed to collect verification fee via Paystack?')) return;

    setProcessingPayment(true);
    try {
      const response = await processPaystackPaymentFlow({
        amount: 30,
        currency: 'GHS',
        email: 'admin@hommie.com',
        type: 'verification',
        reference: generatePaymentReference('PAYSTACK'),
        metadata: { property_id: property.id, owner_id: property.owner_id },
      });

      if (response.status !== 'success') {
        alert(response.message || 'Payment initialization failed');
        return;
      }

      if (response.data?.authorization_url) {
        window.open(response.data.authorization_url, '_blank');
      }

      await createTransactionRecord(
        property.owner_id,
        'verification',
        30,
        response.data?.reference || generatePaymentReference('PAYSTACK'),
        'paystack',
        property.id
      );

      await updateProperty(propertyId, { verification_fee_paid: true });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingLogo label="Loading property..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">Property not found</p>
          <Link href="/properties" className="text-primary hover:underline">
            Back to Properties
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/properties"
            className="p-2 hover:bg-background rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-text-primary mb-2">{property.title}</h1>
            <p className="text-text-secondary">
              {property.area}, {property.city}, {property.region}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              property.status === 'approved' ? 'bg-green-100 text-green-700' :
              property.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              property.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </span>
            {property.is_verified && (
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <div className="aspect-video rounded-xl overflow-hidden bg-background flex items-center justify-center">
                <Image
                  src="/app-shot-4.png"
                  alt="Property preview"
                  width={1200}
                  height={675}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {['/app-shot-1.png', '/app-shot-2.png', '/app-shot-3.png'].map((src) => (
                  <div key={src} className="aspect-video rounded-xl overflow-hidden bg-background">
                    <Image src={src} alt="Property preview" width={400} height={225} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <h2 className="text-xl font-bold text-text-primary mb-4">Description</h2>
              <p className="text-text-secondary leading-relaxed">
                {property.description || 'No description provided'}
              </p>
            </div>

            {/* Details */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <h2 className="text-xl font-bold text-text-primary mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-secondary">Bedrooms</p>
                    <p className="font-semibold">{property.bedrooms || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-secondary">Bathrooms</p>
                    <p className="font-semibold">{property.bathrooms || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-secondary">Parking</p>
                    <p className="font-semibold">{property.parking ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-text-secondary">Furnished</p>
                    <p className="font-semibold">{property.furnished ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-light text-primary rounded-full text-sm font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            {property.latitude && property.longitude && (
              <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="text-xl font-bold text-text-primary mb-4">Location</h2>
                <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-text-muted" />
                </div>
                <p className="text-sm text-text-secondary mt-3">
                  Coordinates: {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price & Type */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <div className="mb-4">
                <p className="text-3xl font-bold text-primary mb-2">
                  ₵{property.price.toLocaleString()}
                </p>
                <p className="text-text-secondary">per {property.payment_type}</p>
              </div>
              <div className="px-3 py-2 bg-primary-light rounded-xl inline-block">
                <span className="text-primary font-semibold capitalize">{property.type}</span>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Owner Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-text-secondary">Name</p>
                  <p className="font-semibold">{property.owner?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Email</p>
                  <p className="font-semibold">{property.owner?.email || 'No email'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Phone</p>
                  <p className="font-semibold">{property.owner?.phone || 'No phone'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Role</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                    {property.owner?.role || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Actions</h3>
              
              {property.status === 'pending' && (
                <div className="space-y-3">
                  <button
                    onClick={() => updateStatus.mutate('approved')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Approve Listing
                  </button>
                  <button
                    onClick={() => updateStatus.mutate('rejected')}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Reject Listing
                  </button>
                </div>
              )}

              {property.status === 'approved' && (
                <button
                  onClick={() => updateStatus.mutate('suspended')}
                  className="w-full px-4 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 mb-3"
                >
                  <Ban size={20} />
                  Suspend Listing
                </button>
              )}

              {property.status === 'suspended' && (
                <button
                  onClick={() => updateStatus.mutate('approved')}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mb-3"
                >
                  <CheckCircle size={20} />
                  Restore Listing
                </button>
              )}

              <button
                onClick={() => toggleVerification.mutate(!property.is_verified)}
                className={`w-full px-4 py-3 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  property.is_verified
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <CheckCircle size={20} />
                {property.is_verified ? 'Remove Verification' : 'Verify Listing'}
              </button>

              {/* Verification Fee Status */}
              <div className="mt-4 p-4 bg-background rounded-2xl border border-border">
                <h4 className="font-semibold text-text-primary mb-2">Verification Fee</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Fee Status</p>
                    <p className={`text-sm font-semibold ${
                      property.verification_fee_paid ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {property.verification_fee_paid ? '✓ Paid (₵30)' : 'Pending (₵30)'}
                    </p>
                  </div>
                  {!property.verification_fee_paid && (
                    <button
                      onClick={handleVerificationPayment}
                      disabled={processingPayment}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-2xl text-sm font-semibold hover:bg-green-200 transition-colors"
                    >
                      {processingPayment ? 'Processing...' : 'Collect via Paystack'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Created</span>
                  <span className="font-medium">{new Date(property.created_at).toLocaleDateString()}</span>
                </div>
                {property.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Last Updated</span>
                    <span className="font-medium">{new Date(property.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Available</span>
                  <span className={`font-medium ${property.is_available ? 'text-green-600' : 'text-red-600'}`}>
                    {property.is_available ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
