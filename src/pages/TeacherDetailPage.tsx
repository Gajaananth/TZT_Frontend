import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { AdminPasswordConfirmModal } from '../components/common/AdminPasswordConfirmModal';
import { ProtectedImage } from '../components/common/ProtectedImage';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

export const TeacherDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'idcard'>('overview');
  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ID Card form state
  const [dob, setDob] = useState('');
  const [nicOrPassport, setNicOrPassport] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSavingIdInfo, setIsSavingIdInfo] = useState(false);

  const roleName = user?.userRoles?.[0]?.role?.name || '';
  const isAdminOrSuperAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';
  const isSelf = user?.id === teacher?.userId;
  const canEditIdInfo = isAdminOrSuperAdmin || isSelf;

  const loadTeacher = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/teachers/${id}`);
      const data = response.data?.data;
      setTeacher(data || null);
      if (data) {
        setDob(data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '');
        setNicOrPassport(data.nicOrPassport || '');
        setPhotoPreview(data.photoUrl || data.user?.avatarUrl || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load teacher profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeacher();
  }, [id]);

  const handleConfirmDelete = async (password: string) => {
    if (!id) return;
    await apiClient.delete(`/teachers/${id}`, {
      data: { password },
    });
    navigate('/teachers');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveIdInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSavingIdInfo(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let fileData: string | undefined;
      let fileName: string | undefined;
      let mimeType: string | undefined;

      if (photoFile) {
        fileName = photoFile.name;
        mimeType = photoFile.type;
        const reader = new FileReader();
        fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const res = (reader.result as string) || '';
            const base64 = res.includes(',') ? (res.split(',')[1] || '') : res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
      }

      await apiClient.patch(`/teachers/${id}/id-info`, {
        dateOfBirth: dob || null,
        nicOrPassport: nicOrPassport || null,
        ...(fileData ? { fileData, fileName, mimeType } : {}),
      });

      setSuccessMsg('Teacher ID Card information & photo updated successfully!');
      setPhotoFile(null);
      await loadTeacher();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save ID information.');
    } finally {
      setIsSavingIdInfo(false);
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'assignments', label: 'Assignments' },
      { id: 'idcard', label: '🪪 Digital ID & Photo' },
    ],
    [],
  );

  const fullName = teacher ? `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.trim() : 'Teacher';
  const photoSrc = photoPreview || teacher?.photoUrl || teacher?.user?.avatarUrl;

  return (
    <BaseLayout>
      <div className="p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-18 w-18 sm:h-20 sm:w-20 overflow-hidden rounded-2xl border-2 border-indigo-500/30 shadow-lg bg-slate-800 shrink-0">
              <ProtectedImage
                src={photoSrc}
                alt={fullName}
                fallbackText={teacher?.user?.firstName?.charAt(0) || 'T'}
                aspectRatio="square"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">Teacher Profile</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5">Emp ID: {teacher?.employeeId || id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(`/id-card/teacher/${id}`)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md text-sm"
            >
              🪪 View & Print ID Card
            </Button>
            {isAdminOrSuperAdmin && (
              <Button
                id="remove-teacher-btn"
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600/90 text-white hover:bg-red-700 w-fit text-sm"
              >
                🗑️ Remove Teacher
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            {successMsg}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <Card className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile summary</h2>
                <p className="mt-3 text-gray-600 dark:text-gray-400">Employee ID: {teacher?.employeeId || id}</p>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Email: {teacher?.user?.email || '—'}</p>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Specialization: {teacher?.specialization || 'General'}</p>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Date of Joining: {teacher?.dateOfJoining ? new Date(teacher.dateOfJoining).toLocaleDateString() : '—'}
                </p>
                {teacher?.uniqueId && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    ID Card System Code: <span className="font-mono font-bold text-amber-500">{teacher.uniqueId}</span>
                  </p>
                )}
              </div>
              <div className="rounded-2xl bg-slate-100 p-5 dark:bg-slate-700/60 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">Employment Status</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {teacher?.specialization || 'Faculty Member'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Status: {teacher?.isActive === false ? 'Inactive' : 'Active'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Official ID Credential:</span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      teacher?.photoUrl
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}
                  >
                    {teacher?.photoUrl ? '✓ Photo Ready' : '⚠️ Photo Required'}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex gap-2 border-b border-slate-200 pb-4 dark:border-slate-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Assigned Courses</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                      {teacher?.assignments?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Department</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {teacher?.department?.name || 'General Faculty'}
                    </p>
                  </div>
                </div>
              ) : activeTab === 'assignments' ? (
                <div className="mt-6 space-y-3">
                  {(teacher?.assignments?.length
                    ? teacher.assignments
                    : [{ title: 'No active assignments', detail: 'This teacher has not been assigned to any course batches yet.' }]
                  ).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.course?.title || item.title || 'Course Assignment'}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {item.batch?.name ? `Batch: ${item.batch.name}` : item.detail || 'Teaching faculty'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                /* ID Card & Photo Management Tab */
                <div className="mt-6 space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Left: Protected Photo Preview */}
                    <div className="flex flex-col items-center gap-3 w-full md:w-56 shrink-0">
                      <div className="h-60 w-48 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-xl bg-slate-800">
                        <ProtectedImage
                          src={photoSrc}
                          alt={fullName}
                          fallbackText={teacher?.user?.firstName?.charAt(0) || 'T'}
                          aspectRatio="portrait"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center">
                        🛡️ Protected Photo View
                      </span>
                    </div>

                    {/* Right: ID Info Form */}
                    <form onSubmit={handleSaveIdInfo} className="flex-1 space-y-4 w-full">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Institutional ID Credentials
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Teachers are required to provide their official photo, DOB, and NIC/Passport for printable ID card issuance.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Date of Birth (DOB) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            disabled={!canEditIdInfo}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            NIC or Passport Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 199512345678 or N1234567"
                            value={nicOrPassport}
                            onChange={(e) => setNicOrPassport(e.target.value)}
                            disabled={!canEditIdInfo}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {canEditIdInfo && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Upload Official ID Picture <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Supported: PNG, JPG, JPEG (Square or Portrait ratio recommended).
                          </p>
                        </div>
                      )}

                      <div className="pt-3 flex items-center gap-3">
                        {canEditIdInfo && (
                          <Button
                            type="submit"
                            disabled={isSavingIdInfo}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                          >
                            {isSavingIdInfo ? 'Saving...' : '💾 Save ID Credentials'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(`/id-card/teacher/${id}`)}
                          className="text-sm"
                        >
                          🖨️ View Full ID Card
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Admin Password Confirmation Modal */}
        <AdminPasswordConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Remove Teacher"
          itemName={fullName}
          itemType="teacher"
        />
      </div>
    </BaseLayout>
  );
};
