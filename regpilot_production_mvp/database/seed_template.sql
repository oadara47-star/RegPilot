-- RegPilot seed template.
-- Replace the placeholders below before running:
--   {{COMPANY_NAME}}
--   {{REGULATORY_MANAGER_AUTH_USER_ID}}
--   {{REGULATORY_MANAGER_EMAIL}}
--   {{REGULATORY_MANAGER_FULL_NAME}}

-- 1) Create company
insert into companies (name, sender_email)
values ('{{COMPANY_NAME}}', '{{REGULATORY_MANAGER_EMAIL}}')
returning id;

-- 2) After getting the company UUID above, replace {{COMPANY_ID}} below and run the rest.

insert into profiles (id, company_id, full_name, email, role, department)
values ('{{REGULATORY_MANAGER_AUTH_USER_ID}}', '{{COMPANY_ID}}', '{{REGULATORY_MANAGER_FULL_NAME}}', '{{REGULATORY_MANAGER_EMAIL}}', 'regulatory_manager', 'Regulatory / Compliance')
on conflict (id) do update set role = 'regulatory_manager';

insert into reminder_settings (company_id, sender_name, sender_email, weekly_day, weekly_time, lookahead_days, enabled)
values ('{{COMPANY_ID}}', 'RegPilot Compliance Desk', '{{REGULATORY_MANAGER_EMAIL}}', 'Monday', '07:00', 7, true)
on conflict (company_id) do update set sender_email = excluded.sender_email;

insert into regulatory_lines (company_id, code, name, category, regulator, default_owner_department, is_system) values
('{{COMPANY_ID}}','PAYE','PAYE Monthly Remittance','Finance, Fiscal & Tax','State IRS / LIRS','Finance / Payroll',true),
('{{COMPANY_ID}}','VAT','VAT Monthly Filing & Remittance','Finance, Fiscal & Tax','FIRS / NRS','Finance / Tax',true),
('{{COMPANY_ID}}','WHT','WHT Monthly Remittance','Finance, Fiscal & Tax','FIRS / State IRS','Finance / Tax',true),
('{{COMPANY_ID}}','CIT-HCT','Companies Income Tax / Hydrocarbon Tax','Finance, Fiscal & Tax','FIRS / NRS','Finance / Tax',true),
('{{COMPANY_ID}}','ROY','Monthly Royalty Statement & Payment','NUPRC Fiscal, Royalty & Concession','NUPRC','Finance / Fiscal',true),
('{{COMPANY_ID}}','CONC-RENT','Concession Rental','NUPRC Fiscal, Royalty & Concession','NUPRC','Finance / Regulatory',true),
('{{COMPANY_ID}}','NUPRC-FEES','NUPRC Fees & Charges','NUPRC Fiscal, Royalty & Concession','NUPRC','Finance / Regulatory',true),
('{{COMPANY_ID}}','PROD','Monthly Production Reporting','Production, Commercial & Crude/Gas','NUPRC','Operations / Regulatory',true),
('{{COMPANY_ID}}','ACD','Advance Cargo Declaration','Production, Commercial & Crude/Gas','NUPRC','Commercial / Regulatory',true),
('{{COMPANY_ID}}','DCSO','Domestic Crude Oil Supply Obligation','Production, Commercial & Crude/Gas','NUPRC','Commercial / Regulatory',true),
('{{COMPANY_ID}}','DGDO','Domestic Gas Delivery Obligation','Production, Commercial & Crude/Gas','NUPRC','Commercial / Gas',true),
('{{COMPANY_ID}}','ECM','ECM Monthly Report','HSSE, Environment & ESG','NUPRC / Environmental Regulator','HSSE',true),
('{{COMPANY_ID}}','ERF','Environmental Remediation Fund','HSSE, Environment & ESG','NUPRC','HSSE / Finance',true),
('{{COMPANY_ID}}','FLARE','Gas Flaring, Venting & Methane','HSSE, Environment & ESG','NUPRC','HSSE / Operations',true),
('{{COMPANY_ID}}','SAFETY','Safety & Incident Compliance','HSSE, Environment & ESG','NUPRC','HSSE',true),
('{{COMPANY_ID}}','DA','Decommissioning & Abandonment','Decommissioning & Asset Retirement','NUPRC','Operations / Finance',true),
('{{COMPANY_ID}}','HCDT','Host Community Development Trust','Host Community Development Trust','NUPRC','Legal / Community Relations / Finance',true),
('{{COMPANY_ID}}','NCDMB','NCDF / NCDMB Levy & Content Compliance','Nigerian Content & Contracting','NCDMB','SCM / Finance',true),
('{{COMPANY_ID}}','NDDC','NDDC Levy','NDDC & Regional Development','NDDC','Finance / Tax',true),
('{{COMPANY_ID}}','NEITI','NEITI Reporting & Reconciliation','NEITI Reporting & Reconciliation','NEITI','Finance / Regulatory',true),
('{{COMPANY_ID}}','LICENCE','PPL/PML/OPL/OML Licence & Acreage Governance','Licence, Lease, Legal & Asset Governance','NUPRC / Ministry','Legal / Regulatory',true),
('{{COMPANY_ID}}','FDP','FDP, Work Programme & Drilling Approvals','Licence, Lease, Legal & Asset Governance','NUPRC','Operations / Subsurface',true),
('{{COMPANY_ID}}','ASSIGN','Assignment of Interest / Change of Control','Licence, Lease, Legal & Asset Governance','NUPRC / Ministry','Legal / Corporate Finance',true),
('{{COMPANY_ID}}','CORP','Financial Reporting, CAC, FRC & Audit','Corporate Reporting, Audit & Secretariat','CAC / FRC / FIRS','Finance / Company Secretary',true),
('{{COMPANY_ID}}','CORR','Regulatory Correspondence & Action Tracker','Regulatory Correspondence Management','All Regulators','Regulatory Manager',true)
on conflict do nothing;

-- Seed starter obligations by looking up line IDs.
insert into obligations (company_id, regulatory_line_id, title, regulator, frequency, due_day_rule, next_due_date, status, priority, formula, required_inputs, internal_documents_to_retain, computation_optional, notes)
select '{{COMPANY_ID}}', rl.id, x.title, x.regulator, x.frequency, x.due_day_rule, x.next_due_date::date, x.status::obligation_status, x.priority::priority_level, x.formula, x.required_inputs, x.docs, true, x.notes
from regulatory_lines rl
join (values
('PAYE','PAYE monthly remittance','State IRS / LIRS','Monthly','Usually 10th day of following month','2026-07-10','not_started','high','PAYE payable = Sum employee PAYE based on approved payroll tax schedule',ARRAY['Payroll schedule','Employee taxable pay','Pension relief/CRA where applicable'],ARRAY['PAYE schedule','Payment receipt','Filing acknowledgement'],'Formula shown; user may retain computation internally.'),
('VAT','VAT monthly filing and remittance','FIRS / NRS','Monthly','Usually 21st day of following month','2026-07-21','not_started','high','Net VAT payable = Output VAT - allowable Input VAT',ARRAY['Sales invoices','Purchase invoices','Output VAT','Allowable input VAT'],ARRAY['VAT return','Payment receipt','TaxProMax acknowledgement'],'Formula optional; sensitive invoice detail need not be entered.'),
('WHT','WHT monthly remittance','FIRS / State IRS','Monthly','Following month based on applicable tax authority rule','2026-07-21','not_started','high','WHT = Qualifying payment × applicable WHT rate',ARRAY['Vendor payment','Payment category','Applicable rate'],ARRAY['WHT schedule','Payment receipt','Credit notes where issued'],'Rates depend on transaction class.'),
('ROY','Monthly royalty statement and payment','NUPRC','Monthly','Royalty statement/payment timeline per applicable NUPRC royalty rules','2026-07-15','not_started','critical','Royalty = Production/chargeable volume × price/value basis × applicable royalty rate',ARRAY['Production volume','Price/value basis','Field/licence category','Applicable rate'],ARRAY['Royalty statement','NUPRC assessment/receipt','Production reconciliation'],'Requires flexible royalty matrix.'),
('CONC-RENT','Concession rental','NUPRC','Annual / as assessed','Based on licence/lease acreage and NUPRC assessment/payment rule','2026-08-31','not_started','high','Concession rental = Applicable acreage × prescribed rate for licence/lease category',ARRAY['Acreage','Licence/lease type','Prescribed rate','Period'],ARRAY['NUPRC assessment','Payment receipt','Licence/lease support'],'Do not call this generic rent in the product.'),
('ECM','ECM monthly report','NUPRC / Environmental Regulator','Monthly','Company/regulator reporting calendar','2026-07-05','not_started','medium',null,ARRAY[]::text[],ARRAY['ECM report','HSSE review evidence','Submission acknowledgement'],'HSSE-only line can be assigned to HSSE officer.'),
('ERF','Environmental Remediation Fund obligation','NUPRC','Periodic / as assessed','Based on applicable NUPRC ERF regulation/assessment','2026-09-30','not_started','high','ERF contribution = applicable regulatory/company basis × prescribed rate or assessment',ARRAY['Assessment basis','Applicable rate/assessment','Period'],ARRAY['Assessment','Computation support','Payment receipt'],'Formula placeholder to be refined.'),
('HCDT','HCDT annual contribution','NUPRC','Annual','PIA/HCDT governance timetable','2026-12-31','not_started','critical','HCDT contribution = 3% × applicable OPEX basis, subject to exact PIA/company interpretation',ARRAY['Applicable OPEX basis','Prior year/period basis','Adjustments'],ARRAY['HCDT computation','Board/trust approval','Payment/funding evidence'],'Sensitive OPEX details should remain internal if preferred.'),
('NCDMB','NCDF / NCDMB levy','NCDMB','Transaction-based','At contract/payment trigger or statutory remittance cycle','2026-07-31','not_started','high','NCDF levy = Qualifying contract value × 1%',ARRAY['Contract value','Qualifying contract category'],ARRAY['Contract schedule','Deduction/remittance evidence','NCDMB correspondence'],'Useful for procurement and finance.'),
('NEITI','NEITI reporting template','NEITI','Annual / periodic','Based on NEITI reporting timetable/request','2026-11-30','not_started','medium',null,ARRAY[]::text[],ARRAY['NEITI template','Payment/production reconciliation','Submission proof'],'Reconciliation-based rather than computation-based.'),
('CORR','Regulatory query/action tracker','All Regulators','Event-based','Based on regulator letter/query deadline','2026-07-12','not_started','high',null,ARRAY[]::text[],ARRAY['Regulator letter','Response copy','Internal sign-off'],'The app tracks action status, not evidence files.')
) as x(code,title,regulator,frequency,due_day_rule,next_due_date,status,priority,formula,required_inputs,docs,notes)
on rl.code = x.code and rl.company_id = '{{COMPANY_ID}}';
