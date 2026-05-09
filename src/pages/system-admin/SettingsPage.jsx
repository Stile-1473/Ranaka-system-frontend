import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatCard from "../../components/dashboard/StatCard";
import InputField from "../../components/forms/InputField";
import { useSettingsMutationStore } from "../../stores/mutation/settingsMutationStore";
import { useSettingsQueryStore } from "../../stores/query/settingsQueryStore";

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

function SectionBlock({ title, description, badge, children }) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="panel-title">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          ) : null}
        </div>
        {badge}
      </div>
      <div className="mt-6">{children}</div>
    </Card>
  );
}

function PolicyMetric({ label, value, helper }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

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

  const stageCount = useMemo(
    () => (workflowSettings?.stages || []).length,
    [workflowSettings]
  );

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Workflow Control</p>
          <h2 className="page-action-title">Workflow Settings</h2>
          <p className="page-action-subtitle">
            Control expected approval timing, reminder behavior, and the urgency rules that shape how requests move through the system.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Admin SLA"
          value={slaSettings?.adminSlaHours ?? "--"}
          helper="Hours allowed for admin review"
        />
        <StatCard
          label="GM SLA"
          value={slaSettings?.gmSlaHours ?? "--"}
          helper="Hours allowed for GM approval"
        />
        <StatCard
          label="CEO SLA"
          value={slaSettings?.ceoSlaHours ?? "--"}
          helper="Hours allowed for final authorization"
        />
        <StatCard
          label="Reminder"
          value={slaSettings?.reminderHoursBeforeBreach ?? "--"}
          tone="amber"
          helper="Hours before breach reminder fires"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionBlock
          title="SLA Settings"
          description="Define the expected time limits for each approval stage and when reminders should fire before a breach."
          badge={<Badge variant="warning">Hours</Badge>}
        >
          <form className="space-y-4" onSubmit={handleSaveSla}>
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

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={updateSlaStatus === "loading"}>
                {updateSlaStatus === "loading" ? "Saving..." : "Save SLA Settings"}
              </Button>
            </div>
          </form>
        </SectionBlock>

        <SectionBlock
          title="Priority Settings"
          description="Set the urgency thresholds that determine how long each priority level is allowed to remain in the workflow."
          badge={<Badge variant="neutral">Priority</Badge>}
        >
          <form className="space-y-4" onSubmit={handleSavePriority}>
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

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={updatePriorityStatus === "loading"}>
                {updatePriorityStatus === "loading"
                  ? "Saving..."
                  : "Save Priority Settings"}
              </Button>
            </div>
          </form>
        </SectionBlock>
      </div>

      <SectionBlock
        title="Workflow Policy"
        description="The approval route stays fixed to protect governance, traceability, and clear ownership across the platform."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PolicyMetric
            label="Stage Count"
            value={stageCount || "--"}
            helper="Approval stages currently configured"
          />
          <PolicyMetric
            label="Stage Skipping"
            value={workflowSettings?.stageSkippingAllowed ? "Allowed" : "Not allowed"}
            helper="Whether requests can bypass approval stages"
          />
          <PolicyMetric
            label="Final Status"
            value={workflowSettings?.finalStatus?.replaceAll("_", " ") || "Completed"}
            helper="Status applied after final authorization"
          />
          <PolicyMetric
            label="Reminder Mode"
            value="Pre-breach"
            helper="Notifications are sent before SLA expiry"
          />
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-sm font-medium text-slate-200">Stage order</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(workflowSettings?.stages || []).map((stage) => (
              <Badge key={stage} variant="neutral">
                {stage.replaceAll("_", " ")}
              </Badge>
            ))}
          </div>
        </div>
      </SectionBlock>
    </div>
  );
}

export default SettingsPage;
