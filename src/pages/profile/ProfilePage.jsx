import { useEffect, useState } from "react";
import {
  BadgeCheck,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import InputField from "../../components/forms/InputField";
import Badge from "../../components/ui/Badge";
import { changePassword, updateCurrentUser } from "../../services/authService";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useAuthQueryStore } from "../../stores/query/authQueryStore";

const createProfileForm = (user) => ({
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  email: user?.email || "",
  phoneNumber: user?.phoneNumber || "",
});

const EMPTY_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ProfileInfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
        <Icon className="h-4 w-4 text-emerald-300" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-100">
          {value || "Not set"}
        </p>
      </div>
    </div>
  );
}

function ProfilePage() {
  const currentUser = useCurrentUser();
  const setCurrentUser = useAuthQueryStore((state) => state.setCurrentUser);
  const [profileValues, setProfileValues] = useState(createProfileForm(currentUser));
  const [passwordValues, setPasswordValues] = useState(EMPTY_PASSWORD_FORM);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setProfileValues(createProfileForm(currentUser));
  }, [currentUser]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      const updatedUser = await updateCurrentUser({
        firstName: profileValues.firstName.trim(),
        lastName: profileValues.lastName.trim(),
        email: profileValues.email.trim(),
        phoneNumber: profileValues.phoneNumber.trim(),
      });

      setCurrentUser(updatedUser);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Could not update profile", {
        description:
          error?.response?.data?.message ||
          "Please review your details and try again.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setIsSavingPassword(true);

    try {
      await changePassword(passwordValues);
      setPasswordValues(EMPTY_PASSWORD_FORM);
      toast.success("Password changed");
    } catch (error) {
      toast.error("Could not change password", {
        description:
          error?.response?.data?.message ||
          "Please review the password fields and try again.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const initials =
    `${currentUser?.firstName?.[0] || ""}${currentUser?.lastName?.[0] || ""}`.trim() ||
    "U";

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Account</p>
          <h2 className="page-action-title">Manage your profile and security settings.</h2>
          <p className="page-action-subtitle">
            Keep your contact information current and protect the account used across requests, approvals, and notifications.
          </p>
        </div>
        <Badge variant="neutral">{currentUser?.role?.replaceAll("_", " ")}</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-emerald-400/20 bg-emerald-500/12 text-2xl font-semibold text-emerald-200 shadow-[0_0_30px_rgba(34,197,94,0.18)]">
              {initials}
            </div>
            <h3 className="mt-5 text-xl font-semibold text-slate-100">
              {currentUser?.firstName} {currentUser?.lastName}
            </h3>
            <p className="mt-2 text-sm text-slate-300">{currentUser?.email}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Active account
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <ProfileInfoRow
              icon={UserCircle2}
              label="Role"
              value={currentUser?.role?.replaceAll("_", " ")}
            />
            <ProfileInfoRow
              icon={Mail}
              label="Email"
              value={currentUser?.email}
            />
            <ProfileInfoRow
              icon={Phone}
              label="Phone"
              value={currentUser?.phoneNumber || "Not set"}
            />
          </div>

          <div className="mt-8 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-100">Security note</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Your account details are used in notifications, approval history,
                  and audit records across the procurement workflow.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <UserCircle2 className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Personal Details
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Update the information used across notifications, audit history, and approvals.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="First name"
                  value={profileValues.firstName}
                  onChange={(event) =>
                    setProfileValues((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                />
                <InputField
                  label="Last name"
                  value={profileValues.lastName}
                  onChange={(event) =>
                    setProfileValues((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                />
              </div>

              <InputField
                label="Email"
                type="email"
                value={profileValues.email}
                onChange={(event) =>
                  setProfileValues((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />

              <InputField
                label="Phone number"
                value={profileValues.phoneNumber}
                onChange={(event) =>
                  setProfileValues((current) => ({
                    ...current,
                    phoneNumber: event.target.value,
                  }))
                }
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSavingProfile} className="rounded-2xl">
                  {isSavingProfile ? "Saving..." : "Save Details"}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <KeyRound className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Change Password
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Use a strong password that is different from your current one.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
              <InputField
                label="Current password"
                type="password"
                value={passwordValues.currentPassword}
                onChange={(event) =>
                  setPasswordValues((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />

              <InputField
                label="New password"
                type="password"
                value={passwordValues.newPassword}
                onChange={(event) =>
                  setPasswordValues((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
              />

              <InputField
                label="Confirm new password"
                type="password"
                value={passwordValues.confirmPassword}
                onChange={(event) =>
                  setPasswordValues((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSavingPassword} className="rounded-2xl">
                  {isSavingPassword ? "Saving..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
