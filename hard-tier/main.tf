terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "ls_endpoint" {
  type    = string
  default = "http://localhost:4566"
}

variable "env_suffix" {
  type = string
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

# A realistic EC2 instance role — in the real world, this is exactly
# the kind of role an application server runs under, with its
# temporary credentials fetched automatically from the metadata service.
resource "aws_iam_role" "ec2_role" {
  name = "ec2-role-${var.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

output "role_arn" {
  value = aws_iam_role.ec2_role.arn
}
output "role_name" {
  value = aws_iam_role.ec2_role.name
}