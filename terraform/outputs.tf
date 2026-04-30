output "public_ip" {
  value       = aws_eip.block_market.public_ip
  description = "服务器公网 IP"
}

output "game_url" {
  value       = "http://${aws_eip.block_market.public_ip}"
  description = "游戏访问地址"
}