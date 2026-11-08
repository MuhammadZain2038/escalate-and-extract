terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "ls_endpoint" {
  description = "LocalStack endpoint URL"
  type        = string
  default     = "http://localhost:4566"
}

variable "env_suffix" {
  description = "Random suffix for this session's resource names"
  type        = string
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    s3  = var.ls_endpoint
    iam = var.ls_endpoint
    sts = var.ls_endpoint
  }
}

# 1. A low-privilege analyst account — this is the identity whose
#    credentials will end up leaked.
resource "aws_iam_user" "analyst" {
  name = "analyst-${var.env_suffix}"
}

resource "aws_iam_access_key" "analyst_key" {
  user = aws_iam_user.analyst.name
}

# 2. A privileged role, trusted to be assumed by the analyst user.
#    This is the "spare key" — access the analyst shouldn't realistically
#    have been left able to reach, but was.
resource "aws_iam_role" "data_admin" {
  name = "data-admin-${var.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_user.analyst.arn
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# 3. The leaked-credentials bucket — same public misconfiguration
#    technique as Easy tier, reused deliberately so the enumeration
#    skill transfers.
resource "aws_s3_bucket" "leak_bucket" {
  bucket = "corptech-ops-notes-${var.env_suffix}"
}

resource "aws_s3_bucket_public_access_block" "leak_bucket" {
  bucket = aws_s3_bucket.leak_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "leak_bucket_public_read" {
  bucket = aws_s3_bucket.leak_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.leak_bucket.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.leak_bucket]
}

# 4. The careless note — a real person left real credentials and a
#    real role name sitting in plain text inside the public bucket.
resource "aws_s3_object" "ops_notes" {
  bucket       = aws_s3_bucket.leak_bucket.id
  key          = "ops-notes.txt"
  content_type = "text/plain"
  content      = <<-EOT
    Quick note to self before I forget —

    Temp access for the migration script, same as last time:
    Access Key ID: ${aws_iam_access_key.analyst_key.id}
    Secret Access Key: ${aws_iam_access_key.analyst_key.secret}

    If you need the finance data role for the sync job, it's:
    ${aws_iam_role.data_admin.arn}

    Should probably rotate these after the migration's done. Remind me.
  EOT
}

output "leak_bucket_name" {
  value = aws_s3_bucket.leak_bucket.id
}

output "data_admin_role_arn" {
  value = aws_iam_role.data_admin.arn
}