import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ProtectedImage } from '../components/common/ProtectedImage';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

export const IdCardsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const roleName = user?.userRoles?.[0]?.role?.name || '';
  const isAdminOrSuperAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';
  const isTeacher = roleName === 'Teacher';
  const isStudent = roleName === 'Student';

  // Admin Hub State
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Self State for Student/Teacher
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [myProfileData, setMyProfileData] = useState<any | null>(null);

  // Edit Modal State
  const [editingPerson, setEditingPerson] = useState<{ id: string; type: 'student' | 'teacher'; name: string; dob: string; nic: string; photoUrl: string | null } | null>(null);
  const [editDob, setEditDob] = useState('');
  const [editNic, setEditNic] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const loadSelfProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isTeacher) {
        const res = await apiClient.get('/teachers', { params: { limit: 100 } });
        const list = res.data?.data?.teachers || [];
        const found = list.find((t: any) => t.userId === user?.id || t.user?.email === user?.email);
        if (found) {
          setMyProfileId(found.id);
          setMyProfileData(found);
        }
      } else if (isStudent) {
        const res = await apiClient.get('/students', { params: { limit: 100 } });
        const list = res.data?.data?.students || [];
        const found = list.find((s: any) => s.userId === user?.id || s.user?.email === user?.email);
        if (found) {
          setMyProfileId(found.id);
          setMyProfileData(found);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminDirectory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        apiClient.get('/students', { params: { limit: 100 } }),
        apiClient.get('/teachers', { params: { limit: 100 } }),
      ]);
      setStudents(studentsRes.data?.data?.students || []);
      setTeachers(teachersRes.data?.data?.teachers || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to load directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOrSuperAdmin) {
      void loadAdminDirectory();
    } else {
      void loadSelfProfile();
    }
  }, [isAdminOrSuperAdmin, isTeacher, isStudent]);

  const handleOpenEditModal = (person: any, type: 'student' | 'teacher') => {
    const fullName = `${person.user?.firstName || ''} ${person.user?.lastName || ''}`.trim();
    setEditingPerson({
      id: person.id,
      type,
      name: fullName,
      dob: person.dateOfBirth ? person.dateOfBirth.substring(0, 10) : '',
      nic: person.nicOrPassport || '',
      photoUrl: person.photoUrl || person.user?.avatarUrl || null,
    });
    setEditDob(person.dateOfBirth ? person.dateOfBirth.substring(0, 10) : '');
    setEditNic(person.nicOrPassport || '');
    setEditPhotoFile(null);
    setModalSuccess(null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    setIsSaving(true);
    setError(null);

    try {
      let fileData: string | undefined;
      let fileName: string | undefined;
      let mimeType: string | undefined;

      if (editPhotoFile) {
        fileName = editPhotoFile.name;
        mimeType = editPhotoFile.type;
        const reader = new FileReader();
        fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const res = (reader.result as string) || '';
            const base64 = res.includes(',') ? (res.split(',')[1] || '') : res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(editPhotoFile);
        });
      }

      const endpoint = editingPerson.type === 'teacher'
        ? `/teachers/${editingPerson.id}/id-info`
        : `/students/${editingPerson.id}/id-info`;

      await apiClient.patch(endpoint, {
        dateOfBirth: editDob || null,
        nicOrPassport: editNic || null,
        ...(fileData ? { fileData, fileName, mimeType } : {}),
      });

      setModalSuccess('Updated successfully!');
      setTimeout(() => {
        setEditingPerson(null);
        if (isAdminOrSuperAdmin) {
          void loadAdminDirectory();
        } else {
          void loadSelfProfile();
        }
      }, 700);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update ID info.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const name = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
    const email = (s.user?.email || '').toLowerCase();
    const stuId = (s.studentId || '').toLowerCase();
    const uniqueId = (s.uniqueId || '').toLowerCase();
    const nic = (s.nicOrPassport || '').toLowerCase();
    return name.includes(q) || email.includes(q) || stuId.includes(q) || uniqueId.includes(q) || nic.includes(q);
  });

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
    const email = (t.user?.email || '').toLowerCase();
    const empId = (t.employeeId || '').toLowerCase();
    const uniqueId = (t.uniqueId || '').toLowerCase();
    const nic = (t.nicOrPassport || '').toLowerCase();
    return name.includes(q) || email.includes(q) || empId.includes(q) || uniqueId.includes(q) || nic.includes(q);
  });

  return (
    <BaseLayout>
      <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-3xl">🪪</span> Digital ID Cards & QR Studio
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generate, customize, and print verifiable institutional ID cards with tamper-resistant QR codes.
            </p>
          </div>

          {!isAdminOrSuperAdmin && myProfileId && (
            <Button
              onClick={() => navigate(`/id-card/${isTeacher ? 'teacher' : 'student'}/${myProfileId}`)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md text-sm"
            >
              🖨️ View & Print My Full ID Card
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Student / Teacher Self View */}
        {!isAdminOrSuperAdmin && (
          <div className="space-y-6">
            {isLoading ? (
              <Card className="p-12 text-center text-gray-500">Loading your ID credentials…</Card>
            ) : myProfileId && myProfileData ? (
              <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
                {/* ID Card Mini Preview */}
                <div className="rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/20 text-white p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                        TZ
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider">TZIT EDUCATION</p>
                        <p className="text-[8px] text-indigo-300 uppercase">Institutional ID</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                      {isTeacher ? 'FACULTY' : 'STUDENT'}
                    </span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="h-24 w-20 rounded-xl overflow-hidden border border-indigo-400/40 bg-slate-800 shrink-0">
                      <ProtectedImage
                        src={myProfileData.photoUrl || myProfileData.user?.avatarUrl}
                        alt="Profile"
                        fallbackText={myProfileData.user?.firstName?.charAt(0) || 'U'}
                        aspectRatio="portrait"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="font-bold text-white text-base truncate">
                        {myProfileData.user?.firstName} {myProfileData.user?.lastName}
                      </h3>
                      <p className="text-xs text-amber-300 font-mono font-semibold">
                        {myProfileData.uniqueId || 'ID Code Pending'}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {isTeacher ? `Emp: ${myProfileData.employeeId}` : `Stu: ${myProfileData.studentId}`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        NIC: {myProfileData.nicOrPassport || 'Not added'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center border-t border-white/10">
                    <span className="text-[10px] text-emerald-400 font-mono">✓ QR CODE READY</span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/id-card/${isTeacher ? 'teacher' : 'student'}/${myProfileId}`)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700"
                    >
                      Print Card
                    </Button>
                  </div>
                </div>

                {/* Edit Form */}
                <Card className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Your ID Card Information</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isTeacher
                        ? 'Teachers must provide their DOB, NIC/Passport, and Photo.'
                        : 'Students can update their DOB and NIC. Adding a photo is optional.'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => handleOpenEditModal(myProfileData, isTeacher ? 'teacher' : 'student')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                    >
                      ✏️ Edit Photo, DOB & NIC
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center text-gray-500">
                No ID profile found for your account. Please contact an administrator.
              </Card>
            )}
          </div>
        )}

        {/* Admin & SuperAdmin Management Hub */}
        {isAdminOrSuperAdmin && (
          <div className="space-y-6">
            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('students')}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                    activeTab === 'students'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🎓 Students ({students.length})
                </button>
                <button
                  onClick={() => setActiveTab('teachers')}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                    activeTab === 'teachers'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  👨‍🏫 Teachers ({teachers.length})
                </button>
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search name, ID, email, NIC…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Tables */}
            <div className="glass overflow-hidden">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-slate-500">Loading ID card registry…</div>
                ) : activeTab === 'students' ? (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          System ID / QR Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          NIC / Passport
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Photo Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                            No students found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s) => {
                          const fullName = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'Student';
                          const hasPhoto = Boolean(s.photoUrl || s.user?.avatarUrl);
                          return (
                            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-xl overflow-hidden border border-indigo-500/20 bg-slate-800 shrink-0">
                                    <ProtectedImage
                                      src={s.photoUrl || s.user?.avatarUrl}
                                      alt={fullName}
                                      fallbackText={s.user?.firstName?.charAt(0) || 'S'}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{fullName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.user?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                                  {s.uniqueId || s.studentId}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                                {s.nicOrPassport || <span className="text-gray-400 font-sans italic">Not set</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    hasPhoto
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {hasPhoto ? '✓ Photo Added' : 'Optional (Avatar)'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditModal(s, 'student')}
                                  className="text-xs"
                                >
                                  ✏️ Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/id-card/student/${s.id}`)}
                                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  🪪 View / Print
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          System ID / QR Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          NIC / Passport
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Photo Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                            No teachers found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((t) => {
                          const fullName = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() || 'Teacher';
                          const hasPhoto = Boolean(t.photoUrl || t.user?.avatarUrl);
                          return (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-xl overflow-hidden border border-indigo-500/20 bg-slate-800 shrink-0">
                                    <ProtectedImage
                                      src={t.photoUrl || t.user?.avatarUrl}
                                      alt={fullName}
                                      fallbackText={t.user?.firstName?.charAt(0) || 'T'}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{fullName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.user?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                                  {t.uniqueId || t.employeeId}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                                {t.nicOrPassport || <span className="text-gray-400 font-sans italic">Not set</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    hasPhoto
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  }`}
                                >
                                  {hasPhoto ? '✓ Photo Ready' : '⚠️ Photo Required'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditModal(t, 'teacher')}
                                  className="text-xs"
                                >
                                  ✏️ Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/id-card/teacher/${t.id}`)}
                                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  🪪 View / Print
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Edit ID Info Modal */}
        {editingPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Edit ID Credentials for {editingPerson.name}
                </h3>
                <button
                  onClick={() => setEditingPerson(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {modalSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  {modalSuccess}
                </div>
              )}

              <form onSubmit={handleSaveModal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      NIC or Passport
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 199512345678"
                      value={editNic}
                      onChange={(e) => setEditNic(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Upload New ID Picture {editingPerson.type === 'teacher' ? '(Required)' : '(Optional)'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingPerson(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSaving ? 'Saving…' : 'Save ID Info'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};
