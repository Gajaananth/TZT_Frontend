import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ProtectedImage } from '../components/common/ProtectedImage';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

export const IdCardPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [idCardData, setIdCardData] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);

  const isTeacher = type === 'teacher';
  const roleName = user?.userRoles?.[0]?.role?.name || '';
  const isAdminOrSuperAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';

  const loadIdCard = async () => {
    if (!id || !type) return;
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = isTeacher ? `/teachers/${id}/id-card` : `/students/${id}/id-card`;
      const response = await apiClient.get(endpoint);
      const data = response.data?.data;
      setIdCardData(data);

      if (data?.qrPayload) {
        const qrUrl = await QRCode.toDataURL(data.qrPayload, {
          width: 250,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(qrUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load ID card data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadIdCard();
  }, [type, id]);

  const handlePrint = () => {
    window.print();
  };

  const handleIssueCard = async () => {
    if (!id || !type) return;
    setIsIssuing(true);
    try {
      const endpoint = isTeacher ? `/teachers/${id}/issue-id-card` : `/students/${id}/issue-id-card`;
      const res = await apiClient.post(endpoint);
      setIdCardData((prev: any) => ({
        ...prev,
        idCardIssuedAt: res.data?.data?.idCardIssuedAt || new Date().toISOString(),
      }));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to issue card.');
    } finally {
      setIsIssuing(false);
    }
  };

  const fullName = idCardData
    ? `${idCardData.firstName || ''} ${idCardData.lastName || ''}`.trim()
    : isTeacher
    ? 'Teacher ID Card'
    : 'Student ID Card';

  return (
    <BaseLayout>
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Top bar controls - hidden on print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ← Back
              </button>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-500 uppercase tracking-widest font-semibold">
                Digital Credential
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              Official Institutional ID Card
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isAdminOrSuperAdmin && (
              <Button
                variant="outline"
                onClick={handleIssueCard}
                disabled={isIssuing}
                className="text-xs sm:text-sm"
              >
                {isIssuing ? 'Issuing...' : '🎖️ Stamp Official Issue'}
              </Button>
            )}
            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md text-xs sm:text-sm"
            >
              🖨️ Print / Save ID Card
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 print:hidden">
            {error}
          </div>
        )}

        {isLoading ? (
          <Card className="p-12 text-center text-gray-500 print:hidden">
            <div className="animate-spin text-3xl mb-3">⚙️</div>
            <p>Generating cryptographically signed institutional ID card…</p>
          </Card>
        ) : idCardData ? (
          <div className="flex flex-col items-center justify-center gap-8 py-4">
            {/* ID Card Display Frame */}
            <div
              ref={cardRef}
              id="printable-id-card"
              className="relative w-full max-w-[440px] sm:w-[440px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/20 text-white select-none print:shadow-none print:border-slate-800 print:max-w-none print:w-[350px] transition-all"
            >
              {/* Header Decorative Ribbon */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 py-3.5 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white font-extrabold text-lg border border-white/30 shadow-inner">
                    TZ
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] leading-tight text-white">
                      TZIT EDUCATION
                    </h2>
                    <p className="text-[9px] uppercase tracking-wider text-indigo-100/80 font-medium">
                      Institute of Technology & Management
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-sm ${
                    isTeacher
                      ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                      : 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40'
                  }`}
                >
                  {isTeacher ? 'FACULTY' : 'STUDENT'}
                </span>
              </div>

              {/* Main Card Body */}
              <div className="p-5 space-y-4">
                <div className="flex gap-4 items-start">
                  {/* Photo with Copy Protection */}
                  <div className="relative shrink-0">
                    <div className="h-28 w-24 sm:h-32 sm:w-28 rounded-2xl overflow-hidden border-2 border-indigo-400/40 shadow-lg bg-slate-800">
                      <ProtectedImage
                        src={idCardData.photoUrl}
                        alt={fullName}
                        aspectRatio="portrait"
                        fallbackText={idCardData.firstName?.charAt(0) || 'U'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Security Micro Hologram Indicator */}
                    <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md text-[10px] text-slate-950 font-black border border-white/80">
                      ★
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
                      {isTeacher ? 'Faculty Member' : 'Enrolled Student'}
                    </p>
                    <h3 className="text-lg sm:text-xl font-extrabold truncate text-white leading-tight">
                      {fullName}
                    </h3>
                    <div className="pt-1 space-y-0.5 text-xs text-slate-300">
                      <p className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">System ID:</span>
                        <span className="font-mono font-bold text-amber-300 text-[12px]">
                          {idCardData.uniqueId || '—'}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Official ID:</span>
                        <span className="font-mono font-medium text-white">
                          {isTeacher ? idCardData.employeeId : idCardData.studentId || '—'}
                        </span>
                      </p>
                      {idCardData.dateOfBirth && (
                        <p className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">DOB:</span>
                          <span className="font-medium text-white">
                            {new Date(idCardData.dateOfBirth).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                      {idCardData.nicOrPassport && (
                        <p className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">NIC / Pass:</span>
                          <span className="font-mono font-medium text-white">
                            {idCardData.nicOrPassport}
                          </span>
                        </p>
                      )}
                      {isTeacher ? (
                        <p className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Dept/Spec:</span>
                          <span className="font-medium text-white truncate max-w-[130px]">
                            {idCardData.specialization || 'General'}
                          </span>
                        </p>
                      ) : (
                        <p className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Batch:</span>
                          <span className="font-medium text-white truncate max-w-[130px]">
                            {idCardData.batchName || 'General'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Bottom Row: Scannable Security QR & Authenticity Seal */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">
                      Institutional Verification
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      VERIFIED CREDENTIAL
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Issued:{' '}
                      {idCardData.idCardIssuedAt
                        ? new Date(idCardData.idCardIssuedAt).toLocaleDateString()
                        : 'Active Registration'}
                    </p>
                  </div>

                  {/* High Quality Client-Generated QR */}
                  {qrDataUrl && (
                    <div className="flex flex-col items-center bg-white p-1.5 rounded-xl shadow-inner border border-white/40">
                      <img
                        src={qrDataUrl}
                        alt="Security QR Code"
                        className="h-16 w-16 sm:h-18 sm:w-18 pointer-events-none"
                      />
                      <span className="text-[7px] font-mono text-slate-700 font-bold uppercase tracking-tighter mt-0.5">
                        SCAN TO VERIFY
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Footer Microprint */}
              <div className="bg-slate-950/80 px-5 py-2 text-center text-[8px] tracking-wider text-slate-400 border-t border-white/5 uppercase">
                Property of TZIT • If found return to Registrar Office • Non-Transferable
              </div>
            </div>

            {/* Print Help Guidelines */}
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-md print:hidden space-y-1">
              <p>
                💡 <strong>Print Tip</strong>: Click <em>Print / Save ID Card</em> and choose "Save as PDF" or select your card/photo printer.
              </p>
              <p className="text-[11px] text-slate-400">
                Non-admin users cannot copy, inspect, or extract the profile image.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-id-card, #printable-id-card * {
            visibility: visible;
          }
          #printable-id-card {
            position: absolute;
            left: 50%;
            top: 20%;
            transform: translateX(-50%);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </BaseLayout>
  );
};
