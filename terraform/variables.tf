variable "aws_region" {
  default = "ap-southeast-2"
}

variable "instance_type" {
  default = "t3.small"
}

variable "ami_id" {
  default = "ami-0c2ab3b8efb09f272"
}

variable "key_pair_name" {
  type = string
}

variable "admin_ip" {
  type = string
}

variable "repo_url" {
  type = string
}