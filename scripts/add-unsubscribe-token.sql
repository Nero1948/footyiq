-- Adds token-based unsubscribe support for Set For Six daily reminder emails.
-- Run this once in the Supabase SQL editor.

alter table email_subscribers
  add column if not exists unsubscribe_token uuid default gen_random_uuid();

update email_subscribers
set unsubscribe_token = gen_random_uuid()
where unsubscribe_token is null;

alter table email_subscribers
  alter column unsubscribe_token set not null;

create unique index if not exists email_subscribers_unsubscribe_token_idx
  on email_subscribers (unsubscribe_token);
