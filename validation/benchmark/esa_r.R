suppressMessages(library(QCA))
man <- read.delim("manifest_esa.tsv", stringsAsFactors=FALSE, colClasses="character")
for (row in seq_len(nrow(man))) { s <- man[row,]; id <- as.integer(s$id); f <- sprintf("esa_r/%d.txt", id); if (file.exists(f)) next
  conds <- strsplit(s$conditions, ",")[[1]]; dir <- strsplit(s$dir, ",")[[1]]
  d <- read.csv(s$file); o <- if (s$negate=="1") paste0("~",s$outcome) else s$outcome
  out <- tryCatch({ setTimeLimit(elapsed=30, transient=TRUE)
    tt <- truthTable(d, outcome=o, conditions=paste(conds,collapse=","), incl.cut=as.numeric(s$incl), pri.cut=as.numeric(s$pri), n.cut=as.numeric(s$freq), complete=TRUE)
    csa <- tryCatch(findRows(obj=tt, type=2), error=function(e) integer(0))
    ps <- if (length(csa)) minimize(tt, include="?", exclude=csa) else minimize(tt, include="?")
    de <- c(); for (j in seq_along(conds)) { if (dir[j]=="1") de <- c(de, conds[j]); if (dir[j]=="0") de <- c(de, paste0("~",conds[j])) }
    it <- if (length(de)) tryCatch(if (length(csa)) minimize(tt, include="?", exclude=csa, dir.exp=paste(de,collapse=",")) else minimize(tt, include="?", dir.exp=paste(de,collapse=",")), error=function(e) NULL) else NULL
    c(paste("CSA", paste(sort(csa), collapse=",")),
      paste("PARS", paste(sapply(ps$solution, function(v) paste(sort(v), collapse="+")), collapse=" | ")),
      paste("INTER", if (is.null(it)) "NA" else paste(sapply(it$i.sol, function(z) paste(sapply(z$solution, function(v) paste(sort(v), collapse="+")), collapse=" | ")), collapse=" || ")))
  }, error=function(e) paste("ERR", gsub("\n"," ",conditionMessage(e))))
  setTimeLimit(elapsed=Inf); writeLines(out, f) }
