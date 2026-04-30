variable "aws_region" {
  description = "AWS 区域"
  default     = "ap-southeast-2"
}

variable "instance_type" {
  description = "EC2 实例类型"
  default     = "t3.micro" # 免费套餐适用
}

variable "key_pair_name" {
  description = "SSH 密钥对名称（AWS EC2 → Key Pairs）"
  type        = string
}

variable "admin_ip" {
  description = "SSH 白名单 IP（curl -s https://api.ipify.org）"
  type        = string
}

variable "repo_url" {
  description = "GitHub 仓库地址（EC2 启动时自动克隆部署）"
  type        = string
}
