# Database Fix for Onboarding RLS Recursion

## Problem
The workspace creation during onboarding was hitting "infinite recursion detected in policy for relation workspace_members" because RLS policies were creating circular dependencies.

## Solution
Created an RPC function `create_workspace_with_membership` that runs with SECURITY DEFINER (bypasses RLS) to create both the workspace and the owner membership atomically.

## Steps to Apply

1. **Run the RPC migration in Supabase SQL Editor:**
   - Open your Supabase dashboard
   - Go to SQL Editor
   - Copy and paste the content of `supabase/migrations/create_workspace_rpc.sql`
   - Execute the query

2. **The RPC function will:**
   - Create a workspace with the authenticated user as owner
   - Create the owner membership record
   - Return the workspace data as JSON
   - Avoid RLS policy recursion by running as SECURITY DEFINER

3. **Frontend changes made:**
   - OnboardingFlow now uses `supabase.rpc('create_workspace_with_membership', {...})` instead of direct table inserts
   - Removed dependency on admin client for workspace creation
   - All workspace creation paths now use the RPC to avoid RLS issues

## Test
After applying the migration, try the onboarding flow again:
1. Sign up with a new account
2. Go through onboarding steps
3. Create a project in Step 6
4. Complete the flow

The workspace should be created successfully without RLS recursion errors.
