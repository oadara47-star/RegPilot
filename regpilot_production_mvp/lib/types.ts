export type UserRole = 'regulatory_manager' | 'department_manager' | 'control_owner' | 'viewer';
export type ObligationStatus = 'not_started' | 'in_progress' | 'awaiting_review' | 'completed' | 'overdue' | 'not_applicable';

export type Profile = {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string | null;
};

export type RegulatoryLine = {
  id: string;
  company_id: string | null;
  code: string;
  name: string;
  category: string;
  regulator: string;
  default_owner_department: string | null;
  is_system: boolean;
};

export type Obligation = {
  id: string;
  company_id: string;
  regulatory_line_id: string;
  title: string;
  regulator: string;
  frequency: string;
  due_day_rule: string;
  next_due_date: string;
  status: ObligationStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner_id: string | null;
  reviewer_id: string | null;
  approver_id: string | null;
  formula: string | null;
  required_inputs: string[] | null;
  internal_documents_to_retain: string[] | null;
  computation_optional: boolean;
  notes: string | null;
};
