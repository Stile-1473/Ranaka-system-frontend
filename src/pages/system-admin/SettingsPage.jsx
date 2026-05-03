import { useEffect, useState } from "react";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import InputField from "../../components/forms/InputField";
import Badge from "../../components/ui/Badge";
import { useSettingsQueryStore } from "../../stores/query/settingsQueryStore";
import { useSettingsMutationStore } from "../../stores/mutation/settingsMutationStore";

const EMPTY_SLA = {
  adminSlaHours: "",
  gmSlaHours: "",
  ceoSlaHours: "",
  reminderHoursBeforeBreach: "",
};

const EMPTY_PRIORITY = {
  criticalSlaHours: "",
  highSlaHours: "",
  mediumSlaHours: "",
  lowSlaHours: "",
};

function SettingsPage() {
  const [slaValues, setSlaValues] = useState(EMPTY_SLA);
  const [priorityValues, setPriorityValues] = useState(EMPTY_PRIORITY);

  const slaSettings = useSettingsQueryStore((state) => state.slaSettings);
  const fetchSlaSettings = useSettingsQueryStore((state) => state.fetchSlaSettings);
  const prioritySettings = useSettingsQueryStore(
    (state) => state.prioritySettings
  );
  const fetchPrioritySettings = useSettingsQueryStore(
    (state) => state.fetchPrioritySettings
  );
  const workflowSettings = useSettingsQueryStore(
    (state) => state.workflowSettings
  );
  const fetchWorkflowSettings = useSettingsQueryStore(
    (state) => state.fetchWorkflowSettings
  );

  const saveSlaSettings = useSettingsMutationStore(
    (state) => state.saveSlaSettings
  );
  const updateSlaStatus = useSettingsMutationStore((state) => state.updateSlaStatus);
  const savePrioritySettings = useSettingsMutationStore(
    (state) => state.savePrioritySettings
  );
  const updatePriorityStatus = useSettingsMutationStore(
    (state) => state.updatePriorityStatus
  );

  useEffect(() => {
    fetchSlaSettings();
    fetchPrioritySettings();
    fetchWorkflowSettings();
  }, [fetchPrioritySettings, fetchSlaSettings, fetchWorkflowSettings]);

  useEffect(() => {
    if (slaSettings) {
      setSlaValues({
        adminSlaHours: String(slaSettings.adminSlaHours ?? ""),
        gmSlaHours: String(slaSettings.gmSlaHours ?? ""),
        ceoSlaHours: String(slaSettings.ceoSlaHours ?? ""),
        reminderHoursBeforeBreach: String(
          slaSettings.reminderHoursBeforeBreach ?? ""
        ),
      });
    }
  }, [slaSettings]);

  useEffect(() => {
    if (prioritySettings) {
      setPriorityValues({
        criticalSlaHours: String(prioritySettings.criticalSlaHours ?? ""),
        highSlaHours: String(prioritySettings.highSlaHours ?? ""),
        mediumSlaHours: String(prioritySettings.mediumSlaHours ?? ""),
        lowSlaHours: String(prioritySettings.lowSlaHours ?? ""),
      });
    }
  }, [prioritySettings]);

  const handleSaveSla = async (event) => {
    event.preventDefault();

    try {
      await saveSlaSettings({
        adminSlaHours: Number(slaValues.adminSlaHours),
        gmSlaHours: Number(slaValues.gmSlaHours),
        ceoSlaHours: Number(slaValues.ceoSlaHours),
        reminderHoursBeforeBreach: Number(slaValues.reminderHoursBeforeBreach),
      });
      toast.success("SLA settings updated");
      await fetchSlaSettings();
    } catch (error) {
      toast.error("Could not update SLA settings", {
        description:
          error?.response?.data?.message || "Please review the values and try again.",
      });
    }
  };

  const handleSavePriority = async (event) => {
    event.preventDefault();

    try {
      await savePrioritySettings({
        criticalSlaHours: Number(priorityValues.criticalSlaHours),
        highSlaHours: Number(priorityValues.highSlaHours),
        mediumSlaHours: Number(priorityValues.mediumSlaHours),
        lowSlaHours: Number(priorityValues.lowSlaHours),
      });
      toast.success("Priority settings updated");
      await fetchPrioritySettings();
    } catch (error) {
      toast.error("Could not update priority settings", {
        description:
          error?.response?.data?.message || "Please review the values and try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Workflow Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Control how quickly requests are expected to move and how urgency is interpreted.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                SLA Settings
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Define the expected time limits for each approval stage.
              </p>
            </div>
            <Badge variant="warning">Hours</Badge>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSaveSla}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Admin SLA"
                type="number"
                min="1"
                value={slaValues.adminSlaHours}
                onChange={(event) =>
                  setSlaValues((current) => ({
                    ...current,
                    adminSlaHours: event.target.value,
                  }))
                }
              />
              <InputField
                label="GM SLA"
                type="number"
                min="1"
                value={slaValues.gmSlaHours}
                onChange={(event) =>
                  setSlaValues((current) => ({
                    ...current,
                    gmSlaHours: event.target.value,
                  }))
                }
              />
              <InputField
                label="CEO SLA"
                type="number"
                min="1"
                value={slaValues.ceoSlaHours}
                onChange={(event) =>
                  setSlaValues((current) => ({
                    ...current,
                    ceoSlaHours: event.target.value,
                  }))
                }
              />
              <InputField
                label="Reminder before breach"
                type="number"
                min="1"
                value={slaValues.reminderHoursBeforeBreach}
                onChange={(event) =>
                  setSlaValues((current) => ({
                    ...current,
                    reminderHoursBeforeBreach: event.target.value,
                  }))
                }
              />
            </div>

            <Button type="submit" disabled={updateSlaStatus === "loading"}>
              {updateSlaStatus === "loading" ? "Saving..." : "Save SLA Settings"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Priority Settings
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Define the urgency targets used to classify priority levels.
              </p>
            </div>
            <Badge variant="neutral">Priority</Badge>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSavePriority}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Critical"
                type="number"
                min="1"
                value={priorityValues.criticalSlaHours}
                onChange={(event) =>
                  setPriorityValues((current) => ({
                    ...current,
                    criticalSlaHours: event.target.value,
                  }))
                }
              />
              <InputField
                label="High"
                type="number"
                min="1"
                value={priorityValues.highSlaHours}
                onChange={(event) =>
                  setPriorityValues((current) => ({
                    ...current,
                    highSlaHours: event.target.value,
                  }))
                }
              />
              <InputField
                label="Medium"
                type="number"
                min="1"
                value={priorityValues.mediumSlaHours}
                onChange={(event) =>
                  setPriorityValues((current) => ({
                    ...current,
                    mediumSlaHours: event.target.value,
                  }))
                }
              />
              <InputField
                label="Low"
                type="number"
                min="1"
                value={priorityValues.lowSlaHours}
                onChange={(event) =>
                  setPriorityValues((current) => ({
                    ...current,
                    lowSlaHours: event.target.value,
                  }))
                }
              />
            </div>

            <Button type="submit" disabled={updatePriorityStatus === "loading"}>
              {updatePriorityStatus === "loading"
                ? "Saving..."
                : "Save Priority Settings"}
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Workflow Policy
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Version 1 keeps the approval route fixed to protect governance and traceability.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-slate-200 px-4 py-4">
            <p className="text-sm font-medium text-slate-700">Stage order</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(workflowSettings?.stages || []).map((stage) => (
                <Badge key={stage} variant="neutral">
                  {stage.replaceAll("_", " ")}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 px-4 py-4">
              <p className="text-sm text-slate-500">Stage skipping</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {workflowSettings?.stageSkippingAllowed ? "Allowed" : "Not allowed"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 px-4 py-4">
              <p className="text-sm text-slate-500">Final status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {workflowSettings?.finalStatus?.replaceAll("_", " ") || "Completed"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SettingsPage;
