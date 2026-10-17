export type JobInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
  zip: string;
};

export type JobErrors = Partial<Record<keyof JobInput, string>>;

// Returns an object of field errors. An empty object means valid.
// Client rule: accept every inquiry, so never reject on service type or location.
export function validateJob(job: JobInput): JobErrors {
  const errors: JobErrors = {};

  if (!job.name.trim()) errors.name = "Please enter your name.";
  if (!job.phone.trim()) errors.phone = "Please enter a phone number.";
  if (!job.email.trim()) errors.email = "Please enter your email.";
  else if (!job.email.includes("@")) errors.email = "Please enter a valid email.";
  if (!job.address.trim()) errors.address = "Please enter the job address.";
  if (!/^\d{5}$/.test(job.zip.trim())) errors.zip = "Please enter a 5-digit ZIP code.";

  return errors;
}
