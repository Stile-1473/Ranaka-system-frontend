import { useEffect, useState } from "react";
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
          error?.response?.data?.message || "Please review your details and try again.",
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
          error?.response?.data?.message || "Please review the password fields and try again.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">My Profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update your contact details and keep your sign-in credentials secure.
          </p>
        </div>
        <Badge variant="neutral">{currentUser?.role?.replaceAll("_", " ")}</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Personal Details
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              These details are used across notifications, audit records, and approvals.
            </p>
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

            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save Details"}
            </Button>
          </form>
        </Card>

        <Card>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Change Password
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Use a strong password that is different from your current one.
            </p>
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

            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? "Saving..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
